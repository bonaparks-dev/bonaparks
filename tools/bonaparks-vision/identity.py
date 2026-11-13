"""Qui est qui : les membres du foyer enregistres par l'utilisateur, reconnus sur place.

Trois indices, croises dans le temps avec le cahier de bord :
 - le visage (photo HD demandee au Hub quand quelqu'un est dans le champ), seulement pour les profils enregistres ;
 - l'apparence (couleurs des vetements ou du pelage) ;
 - la taille et le type figes du profil (un enfant enregistre reste un enfant).
Rien ne quitte cet ordinateur. Aucun visage inconnu n'est conserve : seuls les profils crees par l'utilisateur
gardent des echantillons, et "Supprimer" efface tout le profil.
"""
import json
import threading
import time
import urllib.parse
import urllib.request
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
FACE_MATCH = 0.40        # similarite cosinus SFace (seuil recommande 0,363) : un peu plus strict
LOOK_MATCH = 0.62        # similarite d'apparence (correlation d'histogrammes)
MAX_SAMPLES = 40


class Hub:
    """Photos HD a la demande, avec un jeton de session (une seule connexion, pas de risque de blocage)."""

    def __init__(self, host, user, pwd):
        self.host, self.user, self.pwd = host, user, pwd
        self.token, self.token_until, self.blocked_until = None, 0.0, 0.0
        self.lock = threading.Lock()

    def _login(self):
        body = json.dumps([{"cmd": "Login", "param": {"User": {"Version": "0", "userName": self.user, "password": self.pwd}}}]).encode()
        r = json.loads(urllib.request.urlopen(urllib.request.Request(f"http://{self.host}/api.cgi?cmd=Login", body, {"Content-Type": "application/json"}), timeout=8).read())
        if r[0].get("code") != 0:
            self.blocked_until = time.time() + 600          # identifiants refuses : on n'insiste pas (le Hub se verrouille apres 10 echecs)
            raise RuntimeError("connexion au Hub refusee")
        self.token = r[0]["value"]["Token"]["name"]
        self.token_until = time.time() + int(r[0]["value"]["Token"].get("leaseTime", 3600)) - 60

    def motion(self, channel):
        """Etat de detection de mouvement de la camera, tel que le Hub le connait (sans ouvrir la video)."""
        with self.lock:
            if time.time() < self.blocked_until:
                return False
            if not self.token or time.time() > self.token_until:
                self._login()
            url = f"http://{self.host}/api.cgi?token={urllib.parse.quote(self.token)}"
        body = json.dumps([{"cmd": "GetMdState", "action": 0, "param": {"channel": channel}}]).encode()
        r = json.loads(urllib.request.urlopen(urllib.request.Request(url, body, {"Content-Type": "application/json"}), timeout=5).read())
        if r[0].get("code") != 0:
            self.token = None
            return False
        return r[0]["value"].get("state") == 1

    def snap(self, channel):
        with self.lock:
            if time.time() < self.blocked_until:
                return None
            if not self.token or time.time() > self.token_until:
                self._login()
            url = f"http://{self.host}/cgi-bin/api.cgi?cmd=Snap&channel={channel}&rs={int(time.time() * 1000)}&token={urllib.parse.quote(self.token)}"
        data = urllib.request.urlopen(url, timeout=8).read()
        img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        if img is None:                                        # jeton expire : le Hub renvoie du JSON
            self.token = None
        return img


class Faces:
    def __init__(self):
        m = HERE / "models"
        self.det = cv2.FaceDetectorYN.create(str(m / "face_detection_yunet_2023mar.onnx"), "", (320, 320), 0.8, 0.3, 50)
        self.rec = cv2.FaceRecognizerSF.create(str(m / "face_recognition_sface_2021dec.onnx"), "")
        self.lock = threading.Lock()

    def find(self, img, width=1600):
        """Visages d'une photo HD : [(cadre normalise x1,y1,x2,y2, empreinte)]."""
        k = width / img.shape[1]
        small = cv2.resize(img, (width, int(img.shape[0] * k))) if k < 1 else img
        k = min(k, 1.0)
        with self.lock:
            self.det.setInputSize((small.shape[1], small.shape[0]))
            _, faces = self.det.detect(small)
            out = []
            for f in faces if faces is not None else []:
                if f[2] < 28 or f[3] < 28:                     # trop petit pour etre reconnu de facon fiable
                    continue
                full = f.copy(); full[:14] /= k
                feat = self.rec.feature(self.rec.alignCrop(img, full)).flatten()
                h, w = img.shape[:2]
                out.append(([full[0] / w, full[1] / h, (full[0] + full[2]) / w, (full[1] + full[3]) / h], feat / (np.linalg.norm(feat) + 1e-9), float(f[14])))
        return out


def look(frame, box):
    """Apparence d'une silhouette : histogramme de couleurs du torse (ou du corps pour un animal)."""
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = box
    bx1, bx2 = int(x1 + (x2 - x1) * .2), int(x2 - (x2 - x1) * .2)
    by1, by2 = int(y1 + (y2 - y1) * .18), int(y1 + (y2 - y1) * .7)
    crop = frame[max(0, by1):min(h, by2), max(0, bx1):min(w, bx2)]
    if crop.size < 300:
        return None
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1, 2], None, [12, 6, 4], [0, 180, 0, 256, 0, 256]).flatten()
    return (hist / (hist.sum() + 1e-9)).astype(np.float32)


class Profiles:
    """Membres du foyer enregistres : nom, type fige, couleur, echantillons de visage et d'apparence."""

    def __init__(self, folder):
        self.path = Path(folder) / "profils.json"
        self.items = {}
        self.dirty = False
        self.lock = threading.Lock()
        try:
            for p in json.loads(self.path.read_text(encoding="utf-8")):
                p["faces"] = [np.float32(f) for f in p.get("faces", [])]
                p["looks"] = [np.float32(l) for l in p.get("looks", [])]
                p["hairs"] = [np.float32(h) for h in p.get("hairs", [])]
                self.items[p["id"]] = p
        except (FileNotFoundError, ValueError):
            pass

    def save(self):
        with self.lock:
            data = [{**p, "faces": [f.tolist() for f in p["faces"]], "looks": [l.tolist() for l in p["looks"]],
                     "hairs": [np.asarray(h).tolist() for h in p.get("hairs", [])]} for p in self.items.values()]
        tmp = self.path.with_suffix(".tmp"); tmp.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8"); tmp.replace(self.path)

    def public(self):
        return [{"id": p["id"], "name": p["name"], "kind": p["kind"], "color": p["color"], "faces": len(p["faces"]), "looks": len(p["looks"]), "photo": p.get("photo")} for p in self.items.values()]

    def create(self, name, kind, color):
        pid = "p%d" % (int(time.time() * 1000) % 10_000_000)
        with self.lock:
            self.items[pid] = {"id": pid, "name": name.strip()[:40] or "Sans nom", "kind": kind if kind in ("adulte", "enfant", "animal") else "adulte",
                               "color": color or "#7fd3a0", "faces": [], "looks": [], "created": round(time.time())}
        self.save()
        return pid

    def delete(self, pid):
        with self.lock:
            existed = self.items.pop(pid, None) is not None
        if existed:
            self.save()
        return existed

    def learn_traits(self, pid, hair=None, size=None):
        """Cheveux et taille d'un membre, pour le pourcentage d'identite."""
        p = self.items.get(pid)
        if not p:
            return
        with self.lock:
            if hair is not None:
                p["hairs"] = ([np.float32(h) for h in p.get("hairs", [])] + [hair])[-MAX_SAMPLES:]
            if size is not None:
                p["heights"] = (p.get("heights", []) + [round(float(size), 3)])[-60:]
            self.dirty = True

    def learn(self, pid, face=None, appearance=None, only_new=False):
        """Ajoute des exemples. only_new : seulement s'ils apportent quelque chose (autre angle, autre tenue)."""
        p = self.items.get(pid)
        if not p:
            return False
        added = False
        with self.lock:
            if face is not None and not (only_new and p["faces"] and max(float(np.dot(f, face)) for f in p["faces"]) > .9):
                p["faces"] = (p["faces"] + [face])[-MAX_SAMPLES:]; added = True
            if appearance is not None and not (only_new and p["looks"] and max(float(cv2.compareHist(l, appearance, cv2.HISTCMP_CORREL)) for l in p["looks"]) > .93):
                p["looks"] = (p["looks"] + [appearance])[-MAX_SAMPLES:]
                p.setdefault("look_t", []).append(round(time.time())); p["look_t"] = p["look_t"][-MAX_SAMPLES:]; added = True
            # les vetements changent : une apparence de plus de 7 jours est oubliee (le visage, lui, reste)
            t = p.get("look_t", [])
            if len(t) == len(p["looks"]):
                keep = [k for k, ts in enumerate(t) if time.time() - ts < 7 * 86400]
                p["looks"], p["look_t"] = [p["looks"][k] for k in keep], [t[k] for k in keep]
            if added:
                self.dirty = True
        return added

    def match_face(self, feat):
        best, score = None, 0.0
        for p in self.items.values():
            if p["kind"] == "animal" or not p["faces"]:
                continue
            s = float(max(np.dot(f, feat) for f in p["faces"]))
            if s > score:
                best, score = p["id"], s
        return (best, score) if score >= FACE_MATCH else (None, score)

    def match_look(self, hist, group):
        best, score = None, 0.0
        for p in self.items.values():
            if (p["kind"] == "animal") != (group == "animal") or not p["looks"]:
                continue
            s = float(np.mean(sorted((cv2.compareHist(l, hist, cv2.HISTCMP_CORREL) for l in p["looks"]), reverse=True)[:5]))
            if s > score:
                best, score = p["id"], s
        return (best, score) if score >= LOOK_MATCH else (None, score)
