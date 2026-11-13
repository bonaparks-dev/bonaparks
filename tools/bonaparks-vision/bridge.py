"""Bonaparks Vision : relie le Reolink Home Hub au plan Bonaparks.

Pour chaque camera : lecture du flux RTSP du Hub, detection IA (personnes, chiens, chats)
sur le GPU, projection des pieds de chaque detection sur le plan (homographie de calibrage),
fusion des cameras et suivi. Sert en local :
  GET /state          -> JSON {cameras, tracks}
  GET /events         -> flux SSE du meme JSON (~5 fois/s)
  GET /frame/<id>.jpg -> derniere image de la camera
  GET /warp/<id>.png  -> image de la camera projetee sur le plan (transparente hors champ)
  POST /calibration/<id> -> enregistre {image:[[u,v]x4 (0-1)], plan:[[x,y]x4 (0-1000)], fov:[[x,y]...]}
Tout reste sur le reseau de la maison : aucune image n'est envoyee en ligne.
"""
import json, math, os, sys, threading, time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import quote

import cv2
from logbook import Logbook
from identity import Hub, Faces, Profiles, look
from gate import Gate
from learning import Learning
import household
import numpy as np

HERE = Path(__file__).resolve().parent
CONFIG = HERE / "config.json"
CLASSES = {0: "personne", 15: "animal", 16: "animal", 2: "vehicule", 3: "vehicule", 5: "vehicule", 7: "vehicule"}
def region_color(frame, box, y0, y1, x0=.25, x1=.75):
    """Couleur dominante (mediane) d'une bande du cadre, en #rrggbb ; None si trop petit ou image de nuit (gris)."""
    h, w = frame.shape[:2]
    bx1, by1, bx2, by2 = box
    X1, X2 = int(max(0, bx1 + (bx2 - bx1) * x0)), int(min(w, bx1 + (bx2 - bx1) * x1))
    Y1, Y2 = int(max(0, by1 + (by2 - by1) * y0)), int(min(h, by1 + (by2 - by1) * y1))
    if X2 - X1 < 4 or Y2 - Y1 < 4:
        return None
    px = frame[Y1:Y2, X1:X2].reshape(-1, 3)
    b, g, r = (int(v) for v in np.median(px, axis=0))
    if max(r, g, b) - min(r, g, b) < 6 and abs(r - 128) < 90:     # vision de nuit (infrarouge) : pas de vraie couleur
        return None
    return "#%02x%02x%02x" % (r, g, b)


def box_iou(a, b):
    ix, iy = max(0, min(a[2], b[2]) - max(a[0], b[0])), max(0, min(a[3], b[3]) - max(a[1], b[1]))
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - ix * iy
    return ix * iy / u if u > 0 else 0


def posture(k):
    """Debout / assis / allonge a partir des points du corps (epaules, hanches, genoux) de la posture IA."""
    ok = lambda i: k[i][2] > .35
    mid = lambda a, b: ((k[a][0] + k[b][0]) / 2, (k[a][1] + k[b][1]) / 2) if ok(a) and ok(b) else (k[a][:2] if ok(a) else k[b][:2] if ok(b) else None)
    sh, hp, kn = mid(5, 6), mid(11, 12), mid(13, 14)
    if sh is None or hp is None:
        return None
    dx, dy = hp[0] - sh[0], hp[1] - sh[1]
    torso = math.hypot(dx, dy) or 1.0
    if math.degrees(math.atan2(abs(dx), abs(dy) + 1e-6)) > 55:
        return "allonge"
    if kn is not None and (kn[1] - hp[1]) < .45 * torso:
        return "assis"
    return "debout"


CHILD_MAX = 1.45   # taille estimee sous 1,45 m : enfant (les cameras en plongee grandissent un peu les gens)
os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp")


def load_config():
    return json.loads(CONFIG.read_text(encoding="utf-8-sig"))


def save_config(cfg):
    CONFIG.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")


def credentials(cfg):
    vals = {}
    for line in Path(cfg["credentials_file"]).read_text(encoding="utf-8-sig").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            vals[k.strip()] = v.strip()
    if not vals.get("mot_de_passe"):
        sys.exit("Mot de passe Reolink manquant dans " + cfg["credentials_file"])
    return vals["utilisateur"], vals["mot_de_passe"]


class Camera:
    def __init__(self, spec, hub, user, pwd, plan_size):
        self.spec = spec
        self.id = spec["id"]
        self.url = f"rtsp://{quote(user)}:{quote(pwd)}@{hub}:554/h264Preview_{spec['channel'] + 1:02d}_sub"
        self.plan_size = plan_size
        self.frame = None
        self.jpeg = None
        self.detections = []  # [{kind, conf, plan:[x,y] | None, box}]
        self.online = False
        self.last_frame = 0.0
        self.lock = threading.Lock()
        self.floor = "down"
        self.anchor = None
        self.warp_box = None
        self.set_calibration(spec.get("calibration"))

    def set_calibration(self, cal):
        self.H = None
        self.fov_mask = None
        if not cal:
            return
        self.cal = cal
        self._cal_pending = True

    def _prepare_calibration(self, w, h):
        cal = self.cal
        src = np.float32([[u * w, v * h] for u, v in cal["image"]])
        dst = np.float32(cal["plan"])
        self.H, _ = cv2.findHomography(src, dst)
        pw, ph = self.plan_size
        self.floor = cal.get("floor", "down")
        # zone valide : pixels du plan qui retombent dans l'image...
        seen = cv2.warpPerspective(np.full((h, w), 255, np.uint8), self.H, (pw, ph))
        # ...limitee au sol autour des repères (sinon le haut de l'image s'etire a l'infini)
        zone = np.zeros((ph, pw), np.uint8)
        fov = cal.get("fov")
        if fov:
            cv2.fillPoly(zone, [np.int32(fov)], 255)
        else:
            q = np.float32(cal["plan"]); c = q.mean(axis=0)
            cv2.fillPoly(zone, [np.int32(c + (q - c) * float(cal.get("spread", 1.8)))], 255)
        self.fov_mask = cv2.bitwise_and(seen, zone)
        ys, xs = np.nonzero(self.fov_mask)
        self.anchor = [round(float(xs.mean()), 1), round(float(ys.mean()), 1)] if len(xs) else [float(v) for v in np.float32(cal["plan"]).mean(axis=0)]
        # la projection n'est calculee que sur la zone vue par la camera, en 2x plus net : petite image, affichage fluide
        if len(xs):
            u0, v0, u1, v1 = max(0, int(xs.min()) - 4), max(0, int(ys.min()) - 4), min(pw, int(xs.max()) + 5), min(ph, int(ys.max()) + 5)
        else:
            u0, v0, u1, v1 = 0, 0, pw, ph
        self.warp_box = [u0, v0, u1, v1]
        S = np.array([[2, 0, -2 * u0], [0, 2, -2 * v0], [0, 0, 1]], np.float64)
        self.H_crop, self.crop_size = S @ self.H, (2 * (u1 - u0), 2 * (v1 - v0))
        self.crop_alpha = cv2.GaussianBlur(cv2.resize(self.fov_mask[v0:v1, u0:u1], self.crop_size, interpolation=cv2.INTER_LINEAR), (41, 41), 0)
        self._cal_pending = False
        self._warp_cache = (0.0, None)

    def size_at(self, x1, y1, x2, y2, shape):
        """Taille reelle estimee (m) : hauteur du cadre x echelle du sol au niveau des pieds."""
        if self.H is None:
            return None, False
        h, w = shape[:2]
        fx, fy, d = (x1 + x2) / 2, y2, max(8.0, (x2 - x1) * 0.25)
        a, b = cv2.perspectiveTransform(np.float32([[[fx - d, fy]], [[fx + d, fy]]]), self.H).reshape(-1, 2)
        metres = math.hypot((b[0] - a[0]) * 0.03396, (b[1] - a[1]) * 0.021227)
        size = (y2 - y1) * metres / (2 * d) * float(self.spec.get("height_factor", 1.0))
        cut = y1 < h * 0.02 or y2 > h * 0.975        # tete ou pieds hors de l'image : mesure peu fiable
        return round(size, 2), not cut

    def to_plan(self, x, y):
        if self.H is None:
            return None
        p = cv2.perspectiveTransform(np.float32([[[x, y]]]), self.H)[0][0]
        pw, ph = self.plan_size
        if not (-50 <= p[0] <= pw + 50 and -50 <= p[1] <= ph + 50):
            return None
        return [round(float(p[0]), 1), round(float(p[1]), 1)]

    @property
    def awake(self):
        """Camera "au mouvement" : flux ouvert seulement pendant un mouvement (et 20 s apres). Sinon : toujours."""
        return not self.spec.get("on_motion") or time.time() < getattr(self, "awake_until", 0)

    def reader(self, stop):
        while not stop.is_set():
            if not self.awake:
                time.sleep(.3)
                continue
            cap = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)
            if not cap.isOpened():
                self.online = False
                time.sleep(5)
                continue
            while not stop.is_set():
                if not self.awake:                     # plus de mouvement : on raccroche, la camera n'est plus sollicitee
                    break
                ok, frame = cap.read()
                if not ok:
                    break
                with self.lock:
                    self.frame = frame
                    self.online = True
                    self.last_frame = time.time()
                if time.time() - getattr(self, "_jpeg_at", 0) > 0.06:   # video en direct ~15 images/s
                    self._jpeg_at = time.time()
                    self.jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 72])[1].tobytes()
            cap.release()
            if self.awake:                             # coupure inattendue
                self.online = False
                time.sleep(2)

    def render(self):
        """Prepare l'image JPEG et la projection sur le plan (appele par la boucle IA)."""
        with self.lock:
            frame = None if self.frame is None else self.frame.copy()
        if frame is None:
            return
        h, w = frame.shape[:2]
        if getattr(self, "_cal_pending", False):
            self._prepare_calibration(w, h)

    def learn_background(self, frame, boxes):
        """Image de la piece vide, apprise en continu la ou il n'y a personne."""
        f = frame.astype(np.float32)
        if getattr(self, "bg", None) is None or self.bg.shape != f.shape:
            self.bg, self.bg_n = f.copy(), np.zeros(frame.shape[:2], np.float32)
        mask = np.ones(frame.shape[:2], np.float32)
        h, w = frame.shape[:2]
        for x1, y1, x2, y2 in boxes:
            mx, my = (x2 - x1) * .15, (y2 - y1) * .1
            mask[int(max(0, (y1 - my) * h)):int(min(h, (y2 + my) * h)), int(max(0, (x1 - mx) * w)):int(min(w, (x2 + mx) * w))] = 0
        a = (mask * .04)[..., None]
        self.bg = self.bg * (1 - a) + f * a
        self.bg_n = np.minimum(self.bg_n + mask, 1000)

    def without_people(self, frame):
        """Hologramme : les personnes et animaux sont effaces (remplaces par la piece vide), seul l'avatar les montre."""
        bg = getattr(self, "bg", None)
        dets = [d["box"] for d in getattr(self, "detections", [])]
        if not dets:
            return frame
        out = frame.copy()
        h, w = frame.shape[:2]
        for x1, y1, x2, y2 in dets:
            mx, my = (x2 - x1) * .15, (y2 - y1) * .1
            X1, Y1, X2, Y2 = int(max(0, (x1 - mx) * w)), int(max(0, (y1 - my) * h)), int(min(w, (x2 + mx) * w)), int(min(h, (y2 + my) * h))
            if X2 <= X1 or Y2 <= Y1:
                continue
            if bg is not None and bg.shape == frame.shape and float(self.bg_n[Y1:Y2, X1:X2].min()) > 20:
                out[Y1:Y2, X1:X2] = bg[Y1:Y2, X1:X2].astype(np.uint8)
            else:                                  # pas encore appris : on brouille fortement la zone
                out[Y1:Y2, X1:X2] = cv2.GaussianBlur(out[Y1:Y2, X1:X2], (0, 0), 25)
        return out

    @property
    def warp_png(self):
        """Image de la camera projetee sur le plan, calculee a la demande (cache 0,4 s)."""
        if self.H is None or self.fov_mask is None:
            return None
        t, data = getattr(self, "_warp_cache", (0.0, None))
        if data and time.time() - t < 0.12:
            return data
        with self.lock:
            frame = None if self.frame is None else self.frame.copy()
        if frame is None:
            return None
        frame = self.without_people(frame)
        warped = cv2.warpPerspective(frame, self.H_crop, self.crop_size, flags=cv2.INTER_LINEAR)
        data = cv2.imencode(".jpg", warped, [cv2.IMWRITE_JPEG_QUALITY, 80])[1].tobytes()   # couleur seule : la transparence est un masque fixe (/mask)
        self._warp_cache = (time.time(), data)
        return data


def kalman_predict(t, dt):
    """Filtre de Kalman a vitesse constante sur le plan (comme un GPS) : prevision."""
    F = np.array([[1, 0, dt, 0], [0, 1, 0, dt], [0, 0, 1, 0], [0, 0, 0, 1]], float)
    t["kf_x"] = F @ t["kf_x"]
    t["kf_x"][2:] *= math.exp(-dt * .8)                  # une personne s'arrete souvent : la vitesse s'amortit
    t["kf_P"] = F @ t["kf_P"] @ F.T + np.diag([8 * dt, 8 * dt, 300 * dt, 300 * dt])


def kalman_update(t, z, noise):
    H = np.array([[1, 0, 0, 0], [0, 1, 0, 0]], float)
    S = H @ t["kf_P"] @ H.T + np.eye(2) * noise
    K = t["kf_P"] @ H.T @ np.linalg.inv(S)
    t["kf_x"] = t["kf_x"] + K @ (np.array(z, float) - H @ t["kf_x"])
    t["kf_P"] = (np.eye(4) - K @ H) @ t["kf_P"]
    t["plan"], t["vel"] = [float(t["kf_x"][0]), float(t["kf_x"][1])], [float(t["kf_x"][2]), float(t["kf_x"][3])]


class Tracker:
    """Fusionne les detections des cameras et suit chaque presence sur le plan, sans sauts ni changements de type.

    - Position : filtre adaptatif (lisse a l'arret, suit vite en mouvement) et rejet des sauts isoles.
    - Type : personne / animal puis adulte / enfant decides par vote dans le temps, avec hysteresis.
    - Identite : visages et apparence compares aux profils enregistres ; une identite ne change que sur preuve nette.
    """

    def __init__(self, fuse_distance, profiles):
        self.fuse = fuse_distance
        self.profiles = profiles
        self.tracks = {}
        self.next_id = 1

    @staticmethod
    def _sticky(scores, current, options, ratio=1.6, margin=2.0):
        """Change de valeur seulement si une autre option domine nettement."""
        best = max(options, key=lambda k: scores.get(k, 0))
        if current is None:
            return best
        if best != current and scores.get(best, 0) > scores.get(current, 0) * ratio + margin:
            return best
        return current

    def update(self, observations, now):
        # 1) fusion inter-cameras : points proches au meme etage -> une seule presence
        merged = []
        for o in sorted(observations, key=lambda o: -o["conf"]):
            for m in merged:
                if m["floor"] == o["floor"] and math.dist(m["plan"], o["plan"]) < self.fuse * (1 if m["group"] == o["group"] else .6):
                    k = m["n"]
                    m["plan"] = [(m["plan"][0] * k + o["plan"][0]) / (k + 1), (m["plan"][1] * k + o["plan"][1]) / (k + 1)]
                    m["cameras"].add(o["camera"]); m["n"] += 1
                    if o["kind"]: m["votes"].append((o["kind"], 1.0 if o["reliable"] else 0.5))
                    m["groups"].append((o["group"], o["conf"]))
                    if o.get("box"): m.setdefault("boxes", {})[o["camera"]] = o["box"]
                    if o.get("pose"): m["poses"].append(o["pose"])
                    if o.get("reliable") and o.get("size"): m.setdefault("sizes", []).append((o["camera"], o["size"]))
                    m["edge"] = m["edge"] and o["edge"]
                    m["feet"] = m.get("feet") or o.get("feet"); m["weak"] = m.get("weak", True) and o.get("weak", False)
                    if o.get("face") is not None: m["faces"].append(o["face"])
                    if o.get("look") is not None: m["looks"].append(o["look"])
                    if o.get("hair") is not None: m.setdefault("hairs", []).append(o["hair"])
                    if o.get("colors") and not m.get("colors"): m["colors"] = o["colors"]
                    if o.get("photo") and (not m.get("photo") or o["photo"][0] > m["photo"][0]): m["photo"] = o["photo"]
                    break
            else:
                merged.append({"group": o["group"], "floor": o["floor"], "plan": list(o["plan"]), "cameras": {o["camera"]}, "n": 1, "conf": o["conf"],
                               "votes": [(o["kind"], 1.0 if o["reliable"] else 0.5)] if o["kind"] else [], "groups": [(o["group"], o["conf"])], "edge": o["edge"],
                               "faces": [o["face"]] if o.get("face") is not None else [], "looks": [o["look"]] if o.get("look") is not None else [],
                               "poses": [o["pose"]] if o.get("pose") else [], "photo": o.get("photo"),
                               "sizes": [(o["camera"], o["size"])] if o.get("reliable") and o.get("size") else [],
                               "feet": o.get("feet"), "weak": o.get("weak", False), "boxes": {o["camera"]: o["box"]} if o.get("box") else {}, "colors": o.get("colors"), "hairs": [o["hair"]] if o.get("hair") is not None else []})
        # 2) association aux pistes existantes : plus proche voisin, la position predite par la vitesse
        free = set(self.tracks)
        for m in merged:
            best, bd = None, self.fuse * 2.5
            for tid in free:
                t = self.tracks[tid]
                if t["floor"] != m["floor"]:
                    continue
                dt = now - t["seen"]
                px, py = t["plan"][0] + t["vel"][0] * dt, t["plan"][1] + t["vel"][1] * dt
                d = math.dist((px, py), m["plan"]) * (1 if t["group"] == m["group"] else 1.6)   # un changement de type coute cher
                if d < bd:
                    best, bd = tid, d
            if best is None and m.get("weak"):
                continue                                  # une detection faible ne cree jamais une nouvelle personne
            if best is None:
                best = self.next_id; self.next_id += 1
                self.tracks[best] = {"id": best, "group": m["group"], "kind": None, "floor": m["floor"], "plan": list(m["plan"]), "start": list(m["plan"]), "travel": 0.0, "vel": [0.0, 0.0],
                                     "kf_x": np.array([m["plan"][0], m["plan"][1], 0.0, 0.0]), "kf_P": np.diag([60.0, 60.0, 400.0, 400.0]),
                                     "trail": [], "since": now, "seen": now, "score": {}, "gscore": {}, "who": None, "who_score": {}, "jump": 0}
            else:
                free.discard(best)
                t = self.tracks[best]
                dt = max(0.03, now - t["seen"])
                kalman_predict(t, dt)
                step = math.dist(t["plan"], m["plan"])
                if step > 70 and t["jump"] < 2:          # saut isole (mauvais cadre, reflet) : confirme sur 3 tours avant de bouger
                    t["jump"] += 1
                else:
                    t["jump"] = 0
                    noise = 25 if m.get("feet") else 120 if m.get("weak") else 45   # pieds visibles : mesure sure ; detection faible : peu sure
                    kalman_update(t, m["plan"], noise)
            t = self.tracks[best]
            t["cameras"] = sorted(m["cameras"]); t["seen"] = now; t["edge"] = m["edge"]; t["hits"] = t.get("hits", 0) + 1
            t["boxes"] = {**t.get("boxes", {}), **m.get("boxes", {})}
            for part, col in (m.get("colors") or {}).items():      # couleur stable : moyenne glissante, on garde la derniere vraie couleur
                if col:
                    old = t.setdefault("colors", {}).get(part)
                    if old:
                        a, b2 = int(old[1:], 16), int(col[1:], 16)
                        mix = [int(((a >> s) & 255) * .8 + ((b2 >> s) & 255) * .2) for s in (16, 8, 0)]
                        col = "#%02x%02x%02x" % tuple(mix)
                    t["colors"][part] = col
            if m.get("photo") and (not t.get("photo_best") or m["photo"][0] > t["photo_best"][0]): t["photo_best"] = m["photo"]
            # type : votes ponderes et decroissants, changement seulement si une autre option domine nettement
            for g, c in m["groups"]:
                t["gscore"][g] = t["gscore"].get(g, 0) * .99 + c
            t["group"] = self._sticky(t["gscore"], t["group"], ("personne", "animal", "vehicule"))
            ps = t.setdefault("pscore", {})
            for k in list(ps):
                ps[k] *= .9                                  # la posture change vite (on se leve, on s'assoit) : memoire courte
            for pz in m["poses"]:
                ps[pz] = ps.get(pz, 0) + 1
            if ps:
                t["pose"] = self._sticky(ps, t.get("pose"), ("debout", "assis", "allonge"), 1.3, .8)
            for k, w in m["votes"]:
                t["score"][k] = t["score"].get(k, 0) * .995 + w
            # identite : visage (fort) et apparence (faible), croises dans le temps
            for pid in list(t["who_score"]):
                t["who_score"][pid] *= .985
            if m["looks"]: t["look_last"] = m["looks"][0]
            if m.get("hairs") and "debout" in m.get("poses", []): t["hair_last"] = m["hairs"][0]   # tete visible : pas couche sous la couverture
            for _cam, sz in m.get("sizes", []):
                t["size_hist"] = (t.get("size_hist", []) + [sz])[-15:]
            for k in list(t.get("face_hits", {})):
                t["face_hits"][k] *= .97
            for f in (m["faces"] if t["group"] == "personne" else []):
                for prof in self.profiles.items.values():
                    if prof["kind"] != "animal" and prof["faces"]:
                        sc = float(max(np.dot(x, f) for x in prof["faces"]))
                        t.setdefault("face_hits", {})[prof["id"]] = max(t.get("face_hits", {}).get(prof["id"], 0), sc)
                pid, s = self.profiles.match_face(f)
                if pid: t["who_score"][pid] = t["who_score"].get(pid, 0) + 3 + 4 * (s - .4)
            for l in (m["looks"][:1] if t["group"] != "vehicule" else []):
                pid, s = self.profiles.match_look(l, t["group"])
                if pid: t["who_score"][pid] = t["who_score"].get(pid, 0) + .35 * s
            if t["who_score"]:
                top = max(t["who_score"], key=t["who_score"].get)
                cur = t["who"] if t["who"] in self.profiles.items else None
                if cur is None and t["who_score"][top] >= 2.5:
                    t["who"] = top
                elif cur and top != cur and t["who_score"][top] > t["who_score"].get(cur, 0) + 4:
                    t["who"] = top
                elif cur is None:
                    t["who"] = None
            prof = self.profiles.items.get(t["who"])
            if t.get("forced_kind"):                   # l'utilisateur a choisi le type en touchant le cadre
                t["kind"] = t["forced_kind"]; t["group"] = "animal" if t["kind"] == "animal" else "personne"
            elif prof:                                 # un profil enregistre fige le type
                t["kind"] = prof["kind"]; t["group"] = "animal" if prof["kind"] == "animal" else "personne"
            elif t["group"] in ("animal", "vehicule"):
                t["kind"] = t["group"]
            else:
                settled = t.get("hits", 0) >= 4 and t["kind"] in ("adulte", "enfant")   # les premieres detections (pas encore affichees) votent librement
                t["kind"] = self._sticky(t["score"], t["kind"] if settled else None, ("adulte", "enfant"), 1.8, 3.0)
            # apprentissage continu : reconnu avec certitude -> on ajoute les exemples nouveaux (autre angle, autre tenue)
            if t["who"] and t["who_score"].get(t["who"], 0) >= 6 and now - t.get("auto_at", 0) > 4:
                good_face = next((f for f in m["faces"] if self.profiles.match_face(f)[0] == t["who"] and self.profiles.match_face(f)[1] >= .5), None)
                if good_face is not None or m["looks"]:
                    t["auto_at"] = now
                    self.profiles.learn(t["who"], good_face, m["looks"][0] if m["looks"] and good_face is not None else None, only_new=True)
            if t["who"] and m.get("sizes"):
                t.setdefault("sizes", []).extend(m["sizes"]); t["sizes"] = t["sizes"][-20:]
            # apprentissage demande par l'utilisateur ("c'est Leo") : on enregistre visages et apparence pendant 90 s
            if t.get("learn") and now < t["learn_until"] and now - t.get("learned_at", 0) > .8:
                t["learned_at"] = now
                self.profiles.learn(t["learn"], m["faces"][0] if m["faces"] else None, m["looks"][0] if m["looks"] else None)
            t["travel"] = max(t.get("travel", 0.0), math.dist(t.get("start", t["plan"]), t["plan"]))
        # une meme personne ne peut pas etre a deux endroits : on garde la piste la plus sure
        owners = {}
        for t in self.tracks.values():
            if t["who"]:
                o = owners.get(t["who"])
                if o is None or t["who_score"].get(t["who"], 0) > o["who_score"].get(t["who"], 0):
                    if o: o["who"] = None
                    owners[t["who"]] = t
                else:
                    t["who"] = None
        # 3) oubli des pistes non revues depuis 6 s (le cahier de bord, lui, se souvient)
        for tid in [k for k, t in self.tracks.items() if now - t["seen"] > (6 if t.get("hits", 0) >= 3 else 1.5)]:   # une apparition isolee s'efface vite
            del self.tracks[tid]
        out = []
        for t in self.tracks.values():
            if t.get("hits", 0) < 3:          # pas affichee tant qu'elle n'est pas confirmee (evite les fantomes)
                continue
            prof = self.profiles.items.get(t["who"])
            gap = now - t["seen"]                 # entre deux images : la personne continue sur sa lancee, en ralentissant
            ex = t["plan"][0] + t["vel"][0] * min(gap, .8) * math.exp(-gap * 2), t["plan"][1] + t["vel"][1] * min(gap, .8) * math.exp(-gap * 2)
            out.append({"id": t["id"], "kind": t["kind"] or (t["group"] if t["group"] in ("animal", "vehicule") else "adulte"), "edge": t.get("edge", False), "floor": t["floor"],
                        "plan": [round(ex[0], 1), round(ex[1], 1)], "vel": [round(t["vel"][0], 1), round(t["vel"][1], 1)], "cameras": t.get("cameras", []), "trail": t["trail"], "since": round(t["since"]),
                        "who": t["who"], "match": t.get("match"), "colors": t.get("colors"), "name": prof["name"] if prof else None, "color": prof["color"] if prof else None, "learning": bool(t.get("learn") and now < t["learn_until"]), "travel": round(t.get("travel", 0.0), 1), "pose": t.get("pose")})
        return out


class Vision:
    def __init__(self):
        self.cfg = load_config()
        user, pwd = credentials(self.cfg)
        ps = tuple(self.cfg["plan_size"])
        self.cams = {c["id"]: Camera(c, self.cfg["hub"], user, pwd, ps) for c in self.cfg["cameras"]}
        self.profiles = Profiles(HERE)
        self.gate = Gate(HERE)
        self.learning = Learning(HERE)
        self.photos = {}                     # occupant -> (note, jpeg, type, heure) : en memoire seulement
        self.tracker = Tracker(self.cfg["fuse_distance"], self.profiles)
        self.hub = Hub(self.cfg["hub"], user, pwd)
        self.faces = Faces()
        for c in self.cams.values():
            c.faces, c.face_at, c.person_at = (0.0, []), 0.0, 0.0
            c.result_lock, c.result_obs, c.result_state, c.result_t, c.result_seq, c.used_seq, c.recent = threading.Lock(), [], None, 0.0, 0, 0, []
        self.logbook = Logbook(HERE, {c["id"]: {"name": c["name"], "zone": c["zone"], "floor": (c.get("calibration") or {}).get("floor", "down")} for c in self.cfg["cameras"]}, self.cfg.get("logbook"))
        self.logbook.beds = self.cfg.get("beds", [])
        self.state = {"cameras": [], "tracks": [], "updated": 0}
        self.stop = threading.Event()
        from ultralytics import YOLO
        self.model = YOLO(str(HERE / self.cfg["model"]) if (HERE / self.cfg["model"]).exists() else self.cfg["model"])
        # posture : chaque camera a ses propres modeles (voir camera_worker)

    def motion_loop(self):
        """Demande au Hub, chaque seconde, si les cameras "au mouvement" detectent quelque chose (requete legere)."""
        cams = [c for c in self.cams.values() if c.spec.get("on_motion")]
        while cams and not self.stop.is_set():
            for c in cams:
                try:
                    if self.hub.motion(c.spec["channel"]):
                        c.awake_until = max(getattr(c, "awake_until", 0), time.time() + 20)
                        if not getattr(c, "_was_awake", False):
                            c._was_awake = True
                    elif not c.awake:
                        c._was_awake = False
                except Exception:
                    pass
            time.sleep(1)

    def face_loop(self):
        """Photos HD (1 par seconde au plus, par camera) seulement quand quelqu'un est la et qu'un profil existe."""
        while not self.stop.is_set():
            busy = False
            if True:                        # photos HD des que quelqu'un est la : reconnaissance et photo pour l'enregistrer
                for c in self.cams.values():
                    now = time.time()
                    if now - c.person_at < 2 and now - c.face_at > 1.1:
                        c.face_at = now; busy = True
                        try:
                            img = self.hub.snap(c.spec["channel"])
                            if img is not None:
                                c.faces = (time.time(), self.faces.find(img))
                                c.hd = (time.time(), img)
                        except Exception:
                            pass
            time.sleep(.1 if busy else .3)

    def loop(self):
        for c in self.cams.values():
            threading.Thread(target=c.reader, args=(self.stop,), daemon=True).start()
            threading.Thread(target=self.camera_worker, args=(c,), daemon=True).start()
        threading.Thread(target=self.face_loop, daemon=True).start()
        threading.Thread(target=self.motion_loop, daemon=True).start()
        while not self.stop.is_set():
            t0 = time.time()
            obs, cams = [], []
            for c in self.cams.values():
                with c.result_lock:
                    if c.result_seq != c.used_seq:          # chaque image analysee n'est fusionnee qu'une fois
                        obs.extend(c.result_obs); c.used_seq = c.result_seq
                    if c.result_state:
                        cams.append(c.result_state)
            self.identify(time.time())                       # pourcentage d'identite + maison fermee (avant la mise a jour des pistes)
            tracks = self.tracker.update(obs, time.time())
            self.keep_photos(obs)
            for t in self.tracker.tracks.values():          # tailles reelles des membres reconnus -> limite adulte / enfant par camera
                prof = self.profiles.items.get(t.get("who"))
                for cam_id, sz in t.pop("sizes", []) if prof else []:
                    self.learning.observe_size(cam_id, prof["kind"], sz)
            self.learning.save()
            if self.profiles.dirty and time.time() - getattr(self, "_prof_saved", 0) > 20:
                self.profiles.dirty = False; self._prof_saved = time.time(); self.profiles.save()   # les exemples appris survivent au redemarrage
            self.logbook.update(tracks, time.time(), gate_open_at=self.gate.opened_at, gate_state=self.gate.state, asleep={c.id for c in self.cams.values() if not c.awake})
            book = self.logbook.snapshot()
            for o in book["occupants"]:
                ph = self.photos.get(o["id"])
                o["photo"] = ph[2] if ph else None
            tracked = {o["id"]: o for o in book["occupants"]}
            self.state = {"cameras": cams, "tracks": tracks, "occupants": book["occupants"], "journal": book["journal"], "gate": self.gate.public(),
                          "learning": self.learning.public(list(self.cams)), "updated": round(time.time(), 2)}
            time.sleep(max(0.0, 0.1 - (time.time() - t0)))


    def camera_worker(self, c):
        """Analyse continue d'une camera, dans son propre fil (jusqu'a ~10 images/s), avec ses propres modeles."""
        from ultralytics import YOLO
        c.det_model = YOLO(str(HERE / self.cfg["model"]))
        c.pose_model = YOLO(str(HERE / "yolo11m-pose.pt"))
        last = 0.0
        while not self.stop.is_set():
            if c.last_frame == last or time.time() - c.result_t < .09:
                time.sleep(.02); continue
            last = c.last_frame
            try:
                obs, state = self.process_camera(c)
            except Exception as e:
                print("analyse", c.id, e); time.sleep(.5); continue
            with c.result_lock:
                c.result_obs, c.result_state, c.result_t = obs, state, time.time()
                c.result_seq += 1

    def process_camera(self, c):
        conf = self.cfg["confidence"]
        obs, fresh = [], []
        c.render()
        with c.lock:
            frame = None if c.frame is None else c.frame.copy()
        c.detections = []
        if frame is not None and c.awake and time.time() - c.last_frame < 5:
            r = c.det_model.predict(frame, classes=list(CLASSES), conf=.08, imgsz=c.spec.get("imgsz", 640), verbose=False)[0]
            poses = []
            if any(int(k) == 0 for k in r.boxes.cls.tolist()):   # quelqu'un : on lit aussi sa posture
                rp = c.pose_model.predict(frame, conf=.2, imgsz=c.spec.get("imgsz", 640), verbose=False)[0]
                if rp.keypoints is not None and len(rp.boxes):
                    poses = list(zip(rp.boxes.xyxy.tolist(), rp.keypoints.data.tolist()))
            for box, cls, cf in zip(r.boxes.xyxy.tolist(), r.boxes.cls.tolist(), r.boxes.conf.tolist()):
                x1, y1, x2, y2 = box
                plan = c.to_plan((x1 + x2) / 2, y2)  # point au sol = bas du cadre
                group = CLASSES[int(cls)]
                fh, fw = frame.shape[:2]
                nb = [x1 / fw, y1 / fh, x2 / fw, y2 / fh]
                weak = cf < conf
                if weak and not any(g == group and box_iou(nb, rb) > .3 for g, rb, rt in c.recent if time.time() - rt < 1.5):
                    continue                               # faible et nulle part ou l'on suivait deja quelqu'un : ignore
                if not weak:
                    fresh.append((group, nb, time.time()))
                edge = x1 < fw * 0.03 or x2 > fw * 0.97 or y2 > fh * 0.97 or y1 < fh * 0.01
                size, reliable = c.size_at(x1, y1, x2, y2, frame.shape) if group == "personne" else (None, False)
                if group in ("animal", "vehicule"):
                    kind = group
                elif size is None:
                    kind = None
                elif reliable:
                    kind = "enfant" if size < self.learning.child_max(c.id) else "adulte"
                else:                                  # coupee par le bord : la taille mesuree est un minimum
                    kind = "adulte" if size >= self.learning.child_max(c.id) else None
                if group == "animal" and cf < .5:       # animal peu sur (peluche, couverture) : ignore
                    continue
                if self.learning.ignored(c.id, group, [x1 / fw, y1 / fh, x2 / fw, y2 / fh]):   # erreur deja corrigee ici
                    continue
                if group in ("personne", "animal") and self.learning.reflection(c.id, nb):   # reflet dans un miroir connu
                    continue
                pose, feet = None, False
                if group == "personne" and poses:
                    pb, kp = max(poses, key=lambda p: box_iou(p[0], box))
                    if box_iou(pb, box) > .3:
                        pose = posture(kp)
                        ank = [k for k in (kp[15], kp[16]) if k[2] > .4]
                        hips = [k for k in (kp[11], kp[12]) if k[2] > .4]
                        if pose == "allonge" and hips:          # allonge : le centre du corps
                            plan = c.to_plan(sum(k[0] for k in hips) / len(hips), sum(k[1] for k in hips) / len(hips)) or plan
                        elif ank:                                # pieds lus sur la posture, plus stables que le bas du cadre
                            plan = c.to_plan(sum(k[0] for k in ank) / len(ank), max(k[1] for k in ank)) or plan
                            feet = True
                if plan and c.warp_box:
                    u0, v0, u1, v1 = c.warp_box
                    if not (u0 - 6 <= plan[0] <= u1 + 6 and v0 - 6 <= plan[1] <= v1 + 6):
                        plan = None                        # hors du sol vu par la camera (coin d'image, objet) : pas suivi
                d = {"kind": kind, "group": group, "pose": pose, "weak": weak, "feet": feet, "size": size, "reliable": reliable, "edge": edge, "conf": round(cf, 2), "plan": plan,
                     "box": [round(v / s, 4) for v, s in zip(box, (fw, fh) * 2)]}
                c.detections.append(d)
                c.person_at = time.time()
                if c.spec.get("on_motion"):           # quelqu'un est la : on reste eveille meme sans mouvement
                    c.awake_until = max(getattr(c, "awake_until", 0), time.time() + 20)
                if plan:
                    ob = {**d, "camera": c.id, "floor": c.floor, "look": look(frame, box), "face": None,
                          "hair": household.hair(frame, box) if group == "personne" else None,
                          "colors": ({"top": region_color(frame, box, .22, .5), "bottom": region_color(frame, box, .62, .88, .3, .7),
                                      "hair": region_color(frame, box, 0, .08, .35, .65) if pose == "debout" else None}
                                     if group == "personne" else {"top": region_color(frame, box, .3, .7, .2, .8)})}
                    ft, faces = c.faces
                    if group == "personne" and faces and time.time() - ft < 1.6:
                        bx1, by1, bx2, by2 = d["box"]
                        for fb, feat, fscore in faces:     # visage dans le haut du cadre de cette personne
                            cx, cy = (fb[0] + fb[2]) / 2, (fb[1] + fb[3]) / 2
                            if bx1 <= cx <= bx2 and by1 - .03 <= cy <= by1 + (by2 - by1) * .5:
                                ob["face"] = feat
                                ob["face_box"], ob["face_score"] = fb, fscore
                                break
                    ob["photo"] = self.crop(c, d["box"], ob.get("face_box"), group)
                    obs.append(ob)
        if self.gate.camera == c.id and frame is not None:
            ev = self.gate.update(frame, time.time())
            if ev:
                self.logbook.event(time.time(), "Portail", c.spec["name"], "s'ouvre" if ev == "ouvert" else "se ferme", "portail")
        if frame is not None and c.awake:
            c.learn_background(frame, [d["box"] for d in c.detections])
        # deux silhouettes aux memes vetements en meme temps dans la meme image : sans doute un miroir -> on demande
        people = [o for o in obs if o["group"] == "personne" and o.get("look") is not None]
        if time.time() > getattr(c, "mirror_quiet_until", 0):
            for i in range(len(people)):
                for j in range(i + 1, len(people)):
                    sim = float(cv2.compareHist(people[i]["look"], people[j]["look"], cv2.HISTCMP_CORREL))
                    if sim > .82:
                        c.mirror_suspect = {"boxes": [people[i]["box"], people[j]["box"]], "sim": round(sim, 2), "t": time.time()}
        suspect = getattr(c, "mirror_suspect", None)
        if suspect and time.time() - suspect["t"] > 120:
            c.mirror_suspect = suspect = None
        cam_state = ({"id": c.id, "mirror_suspect": suspect, "name": c.spec["name"], "zone": c.spec["zone"], "online": c.online or (bool(c.spec.get("on_motion")) and not c.awake), "awake": c.awake, "on_motion": bool(c.spec.get("on_motion")),
                     "calibrated": c.H is not None, "floor": c.floor, "anchor": c.anchor, "warp_box": c.warp_box,
                     "detections": [{k: v for k, v in d.items()} for d in c.detections]})
        c.recent = [r for r in c.recent if time.time() - r[2] < 1.5] + fresh   # references : detections sures des 1,5 dernieres s
        return obs, cam_state

    def identify(self, now):
        """Pour chaque personne non nommee : qui est-ce, en pourcentage. Maison fermee : seule entree, le portail."""
        occ = self.logbook.occupants
        entry = self.gate.camera or "dehors"
        visitors = {}
        for o in occ.values():                          # inconnus entres par le portail (vus d'abord dehors)
            if not o.get("who") and o.get("first_room") == entry:
                visitors[o["kind"]] = visitors.get(o["kind"], 0) + 1
        caps = {}
        for prof in self.profiles.items.values():
            caps[prof["kind"]] = caps.get(prof["kind"], 0) + 1
        self.logbook.caps = {k: n + visitors.get(k, 0) for k, n in caps.items() if k in ("enfant", "adulte", "animal")}
        taken = {t["who"]: t for t in self.tracker.tracks.values() if t.get("who")}
        for t in self.tracker.tracks.values():
            if t.get("group") == "vehicule" or t.get("hits", 0) < 3:
                continue
            kind = t.get("kind") or ("animal" if t["group"] == "animal" else "adulte")
            cands = [p for p in self.profiles.items.values() if p["kind"] == kind and p["id"] not in t.get("not_who", set())
                     and (p["id"] not in taken or taken[p["id"]] is t)]
            if not cands:
                t["match"] = None
                continue
            n, v = len(cands), visitors.get(kind, 0)
            prior = .9 if (n == 1 and v == 0) else max(.15, .9 / (n + v))
            best = None
            for p in cands:
                found = household.cues(p, t)
                pr = household.probability(prior, found)
                if best is None or pr > best["p"]:
                    best = {"pid": p["id"], "name": p["name"], "p": round(pr, 3), "prior": round(prior, 2),
                            "cues": {k: round(s, 2) for k, s in found.items()}, "visitors": v}
            t["match"] = best
            confirmed = best and any(v >= .6 for v in best["cues"].values())
            if best and not t.get("who") and best["p"] >= .8 and confirmed:   # sur a 80 % ET un indice reel confirme : on le nomme
                t["who"] = best["pid"]; t["who_score"][best["pid"]] = max(t["who_score"].get(best["pid"], 0), 6)
            if best and t.get("who") == best["pid"] and best["p"] >= .9 and now - t.get("trait_at", 0) > 5:
                t["trait_at"] = now                       # sur a 90 % : on retient ses cheveux et sa taille
                self.profiles.learn_traits(best["pid"], t.get("hair_last"), float(np.median(t["size_hist"])) if t.get("size_hist") else None)

    def calibrate(self, cam_id, cal):
        for spec in self.cfg["cameras"]:
            if spec["id"] == cam_id:
                spec["calibration"] = cal
        save_config(self.cfg)
        self.logbook.rooms[cam_id]["floor"] = cal.get("floor", "down")
        self.cams[cam_id].set_calibration(cal)

    def crop(self, c, box, face_box, group):
        """Meilleure photo possible de cette detection : visage (photo HD), sinon corps. (note, jpeg, type)"""
        ht, hd = getattr(c, "hd", (0.0, None))
        if hd is None or time.time() - ht > 1.6:
            return None
        H_, W_ = hd.shape[:2]
        if face_box is not None:
            x1, y1, x2, y2 = face_box; m = .45
            kind = "visage"
        else:
            x1, y1, x2, y2 = box
            if group == "personne":
                y2 = y1 + (y2 - y1) * .55          # haut du corps
            m, kind = .08, "corps"
        w, h = x2 - x1, y2 - y1
        X1, Y1, X2, Y2 = int(max(0, (x1 - w * m) * W_)), int(max(0, (y1 - h * m) * H_)), int(min(W_, (x2 + w * m) * W_)), int(min(H_, (y2 + h * m) * H_))
        if X2 - X1 < 24 or Y2 - Y1 < 24:
            return None
        img = hd[Y1:Y2, X1:X2]
        if max(img.shape[:2]) > 360:
            k = 360 / max(img.shape[:2]); img = cv2.resize(img, (int(img.shape[1] * k), int(img.shape[0] * k)), interpolation=cv2.INTER_AREA)
        sharp = float(cv2.Laplacian(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
        score = (1000 if kind == "visage" else 0) + min(400, (X2 - X1) * (Y2 - Y1) / 400) + min(300, sharp / 3)
        return score, cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])[1].tobytes(), kind

    def keep_photos(self, observations):
        """Garde, pour chaque presence du cahier de bord, sa meilleure photo (en memoire uniquement)."""
        by_track = {o.get("track"): oid for oid, o in self.logbook.occupants.items() if o.get("track") is not None}
        for t in self.tracker.tracks.values():
            best = t.pop("photo_best", None)
            oid = by_track.get(t["id"])
            if best and oid is not None:
                old = self.photos.get(oid)
                if old is None or best[0] > old[0] or (time.time() - old[3] > 120 and best[0] > old[0] * .8):
                    self.photos[oid] = (best[0], best[1], best[2], time.time())
        for oid in [k for k in self.photos if k not in self.logbook.occupants]:
            del self.photos[oid]                 # personne oubliee : sa photo aussi

    def learn(self, pid, oid):
        """L'utilisateur dit qui est cette presence : on l'associe et on apprend son visage et son apparence."""
        prof = self.profiles.items.get(pid)
        occ = self.logbook.occupants.get(oid)
        if not prof or not occ:
            return False
        t = self.tracker.tracks.get(occ.get("track"))
        if t:
            t.update(learn=pid, learn_until=time.time() + 90, who=pid)
            t["who_score"][pid] = t["who_score"].get(pid, 0) + 12
        self.logbook.name(occ, prof)
        ph = self.photos.get(oid)
        if ph and (not self.profiles.items[pid].get("photo_score") or ph[0] > self.profiles.items[pid]["photo_score"]):
            (HERE / "photos").mkdir(exist_ok=True)
            (HERE / "photos" / f"{pid}.jpg").write_bytes(ph[1])          # seule la photo d'un profil enregistre est gardee
            self.profiles.items[pid].update(photo=ph[2], photo_score=round(ph[0]))
            self.profiles.save()
        return True


def serve(v):
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, body, ctype):
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()

        def do_GET(self):
            p = self.path.split("?")[0]
            if p == "/state":
                return self._send(200, json.dumps(v.state).encode(), "application/json")
            if p == "/events":
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                try:
                    while True:
                        self.wfile.write(b"data: " + json.dumps(v.state).encode() + b"\n\n")
                        self.wfile.flush()
                        time.sleep(0.1)
                except (BrokenPipeError, ConnectionResetError):
                    return
            if p.startswith("/video/"):   # flux video continu (MJPEG) pour le calage
                cid = p[len("/video/"):].rsplit(".", 1)[0]
                cam = v.cams.get(cid)
                if not cam:
                    return self._send(404, b"", "text/plain")
                self.send_response(200)
                self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=bpframe")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                sent = None
                try:
                    while True:
                        if cam.spec.get("on_motion"):
                            cam.awake_until = max(getattr(cam, "awake_until", 0), time.time() + 5)
                        data = cam.jpeg
                        if data and data is not sent:
                            self.wfile.write(b"--bpframe\r\nContent-Type: image/jpeg\r\nContent-Length: " + str(len(data)).encode() + b"\r\n\r\n" + data + b"\r\n")
                            self.wfile.flush()
                            sent = data
                        time.sleep(0.05)
                except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
                    return
            if p.startswith("/mask/"):    # zone vue par la camera : ne change qu'au calage
                cam = v.cams.get(p[len("/mask/"):].rsplit(".", 1)[0])
                if not cam or getattr(cam, "crop_alpha", None) is None:
                    return self._send(404, b"", "text/plain")
                return self._send(200, cv2.imencode(".png", cam.crop_alpha)[1].tobytes(), "image/png")
            for prefix, attr, ctype in (("/frame/", "jpeg", "image/jpeg"), ("/warp/", "warp_png", "image/jpeg")):
                if p.startswith(prefix):
                    cid = p[len(prefix):].rsplit(".", 1)[0]
                    data = getattr(v.cams.get(cid), attr, None) if cid in v.cams else None
                    return self._send(200, data, ctype) if data else self._send(404, b"", "text/plain")
            if p.startswith("/photo/"):
                ph = v.photos.get(int(p[len("/photo/"):].split(".")[0] or -1))
                return self._send(200, ph[1], "image/jpeg") if ph else self._send(404, b"", "text/plain")
            if p.startswith("/profiles/") and p.endswith("/photo.jpg"):
                f = HERE / "photos" / (p.split("/")[2] + ".jpg")
                return self._send(200, f.read_bytes(), "image/jpeg") if f.exists() else self._send(404, b"", "text/plain")
            if p == "/profiles":
                return self._send(200, json.dumps(v.profiles.public()).encode(), "application/json")
            if p in ("/", "/calibrer"):
                return self._send(200, (HERE / "calibrer.html").read_bytes(), "text/html; charset=utf-8")
            if p == "/plan.jpg":
                return self._send(200, (HERE / "plan.jpg").read_bytes(), "image/jpeg")
            self._send(404, b"", "text/plain")

        def do_POST(self):
            p = self.path.split("?")[0]
            if p.startswith("/detect/"):                                 # correction d'un cadre touche sur la video
                body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 2) or b"{}")
                cam_id, box, action = body.get("camera"), body.get("box"), p.rsplit("/", 1)[1]
                if cam_id not in v.cams or not box:
                    return self._send(400, b"", "text/plain")
                best = max(v.tracker.tracks.values(), key=lambda t: box_iou(t.get("boxes", {}).get(cam_id, [0, 0, 0, 0]), box), default=None)
                t = best if best and box_iou(best.get("boxes", {}).get(cam_id, [0, 0, 0, 0]), box) > .3 else None
                occ_id = next((k for k, o in v.logbook.occupants.items() if t and o.get("track") == t["id"]), None)
                room = v.cams[cam_id].spec["name"]
                if action == "kind" and body.get("kind") in ("adulte", "enfant", "animal"):
                    if t:
                        t["forced_kind"] = body["kind"]
                    if occ_id is not None:
                        v.logbook.occupants[occ_id]["kind"] = body["kind"]
                    v.logbook.event(time.time(), "Correction", room, f"c'est {'un adulte' if body['kind'] == 'adulte' else 'un enfant' if body['kind'] == 'enfant' else 'un animal'} (choisi par toi)", "info")
                elif action == "who" and body.get("pid") in v.profiles.items:
                    if t:
                        t["forced_kind"] = v.profiles.items[body["pid"]]["kind"]
                    if occ_id is None or not v.learn(body["pid"], occ_id):
                        return self._send(409, b'{"error":"pas encore suivi"}', "application/json")
                elif action == "nothing":
                    group = "personne" if (t or {}).get("group", "personne") == "personne" else t["group"]
                    v.learning.forbid(cam_id, group, box)
                    if occ_id is not None:
                        v.logbook.occupants.pop(occ_id, None); v.photos.pop(occ_id, None)
                    v.logbook.event(time.time(), "Correction", room, "ce n'était rien (objet) : endroit retenu", "info")
                else:
                    return self._send(400, b"", "text/plain")
                v.logbook._save()
                return self._send(200, b'{"ok":true}', "application/json")
            if p.startswith("/occupants/") and p.endswith("/notwho"):  # "non, ce n'est pas lui"
                oid = int(p.split("/")[2]); body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 2) or b"{}")
                occ = v.logbook.occupants.get(oid)
                t = v.tracker.tracks.get(occ.get("track")) if occ else None
                if t:
                    t.setdefault("not_who", set()).add(body.get("pid")); t["who"] = None; t["who_score"].pop(body.get("pid"), None)
                if occ and occ.get("who") == body.get("pid"):
                    occ.update(who=None, name=None, color=None)
                return self._send(200, b'{"ok":true}', "application/json")
            if p.startswith("/occupants/") and p.endswith("/not"):     # "ce n'est pas un animal / une personne"
                oid = int(p.split("/")[2])
                occ = v.logbook.occupants.get(oid)
                if not occ:
                    return self._send(404, b"", "text/plain")
                group = "animal" if occ["kind"] == "animal" else "vehicule" if occ["kind"] == "vehicule" else "personne"
                cam = v.cams.get(occ["room"])
                boxes = [d["box"] for d in (cam.detections if cam else []) if (d["group"] if "group" in d else d["kind"]) == group]
                for bx in boxes or []:
                    v.learning.forbid(occ["room"], group, bx)
                v.logbook.event(time.time(), "Correction", v.logbook.rooms.get(occ["room"], {}).get("name", occ["room"]), f"ce n'était pas {'un animal' if group == 'animal' else 'un véhicule' if group == 'vehicule' else 'une personne'} : endroit retenu", "info")
                del v.logbook.occupants[oid]; v.photos.pop(oid, None); v.logbook._save()
                return self._send(200, json.dumps({"ok": True, "endroits": len(boxes)}).encode(), "application/json")
            if p == "/mirror":                                          # "oui, c'est un reflet" : l'IA retient le cadre du miroir
                body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 2) or b"{}")
                cam = v.cams.get(body.get("camera"))
                box = body.get("box")
                if not cam or not box or len(box) != 4:
                    return self._send(400, b"", "text/plain")
                w, h = box[2] - box[0], box[3] - box[1]
                v.learning.add_mirror(cam.id, [max(0, box[0] - w * .15), max(0, box[1] - h * .1), min(1, box[2] + w * .15), min(1, box[3] + h * .08)])
                cam.mirror_suspect, cam.mirror_quiet_until = None, time.time() + 600
                v.logbook.event(time.time(), "Miroir", cam.spec["name"], "repéré : les reflets ne sont plus comptés comme des personnes", "info")
                return self._send(200, b'{"ok":true}', "application/json")
            if p == "/mirror/no":                                       # "non, pas de miroir" : on ne redemande pas avant 1 h
                body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 2) or b"{}")
                cam = v.cams.get(body.get("camera"))
                if cam:
                    cam.mirror_suspect, cam.mirror_quiet_until = None, time.time() + 3600
                return self._send(200, b'{"ok":true}', "application/json")
            if p == "/learning/reset":
                v.learning.reset()
                return self._send(200, b'{"ok":true}', "application/json")
            if p.startswith("/gate/"):
                body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 2) or b"{}")
                if p == "/gate/roi" and body.get("camera") in v.cams and len(body.get("roi", [])) == 4:
                    v.gate.set_roi(body["camera"], body["roi"])
                    return self._send(200, b'{"ok":true}', "application/json")
                if p == "/gate/learn" and v.gate.camera in v.cams:
                    cam = v.cams[v.gate.camera]
                    with cam.lock:
                        frame = None if cam.frame is None else cam.frame.copy()
                    ok = v.gate.learn(frame, body.get("etat"))
                    if ok:
                        v.logbook.event(time.time(), "Portail", cam.spec["name"], "exemple « " + ("fermé" if body.get("etat") == "ferme" else "ouvert") + " » appris", "portail")
                    return self._send(200 if ok else 400, b'{"ok":true}' if ok else b"{}", "application/json")
                return self._send(400, b"", "text/plain")
            if p.startswith("/profiles"):
                body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 2) or b"{}")
                parts = p.strip("/").split("/")
                if len(parts) == 1:                                   # creer un profil
                    pid = v.profiles.create(str(body.get("name", "")), str(body.get("kind", "adulte")), str(body.get("color", "#7fd3a0")))
                    if body.get("occupant") is not None:
                        v.learn(pid, int(body["occupant"]))
                    return self._send(200, json.dumps({"id": pid}).encode(), "application/json")
                pid, action = parts[1], parts[2] if len(parts) > 2 else ""
                if action == "learn":                                 # "c'est lui / elle"
                    ok = v.learn(pid, int(body.get("occupant", -1)))
                    return self._send(200 if ok else 404, b'{"ok":true}' if ok else b"{}", "application/json")
                if action == "delete":                                # efface le profil et tous ses echantillons
                    ok = v.profiles.delete(pid)
                    (HERE / "photos" / f"{pid}.jpg").unlink(missing_ok=True)
                    v.logbook.unname(pid)
                    return self._send(200 if ok else 404, b'{"ok":true}' if ok else b"{}", "application/json")
                return self._send(404, b"", "text/plain")
            if p.startswith("/calibration/"):
                cid = p.rsplit("/", 1)[1]
                if cid not in v.cams:
                    return self._send(404, b"", "text/plain")
                cal = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
                if len(cal.get("image", [])) != 4 or len(cal.get("plan", [])) != 4:
                    return self._send(400, b"4 points image + 4 points plan", "text/plain")
                v.calibrate(cid, cal)
                return self._send(200, b'{"ok":true}', "application/json")
            self._send(404, b"", "text/plain")

    srv = ThreadingHTTPServer((v.cfg["listen"], v.cfg["port"]), H)
    print(f"Bonaparks Vision pret : http://127.0.0.1:{v.cfg['port']}/calibrer")
    srv.serve_forever()


if __name__ == "__main__":
    vision = Vision()
    threading.Thread(target=vision.loop, daemon=True).start()
    serve(vision)


