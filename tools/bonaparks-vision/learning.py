"""Apprentissage continu, en local.

 - Taille adulte / enfant apprise camera par camera, a partir des membres enregistres et reconnus.
 - Corrections de l'utilisateur ("ce n'est pas un animal") : l'endroit est retenu, la meme erreur n'est plus faite.
Tout est dans apprentissage.json, sur cet ordinateur.
"""
import json
import statistics
import threading
import time
from pathlib import Path

DEFAULT_CHILD_MAX = 1.45


class Learning:
    def __init__(self, folder):
        self.path = Path(folder) / "apprentissage.json"
        self.lock = threading.Lock()
        self.sizes = {}          # camera -> {"adulte": [...], "enfant": [...]} tailles mesurees (fiables) des membres reconnus
        self.ignore = []         # [{camera, group, x, y, r, t}] : fausses detections corrigees par l'utilisateur
        self.mirrors = []        # [{camera, box:[x1,y1,x2,y2]}] : cadres de miroir (normalises) ; une silhouette dedans est un reflet
        self.dirty, self.saved_at = False, 0.0
        try:
            d = json.loads(self.path.read_text(encoding="utf-8"))
            self.sizes, self.ignore, self.mirrors = d.get("sizes", {}), d.get("ignore", []), d.get("mirrors", [])
        except (FileNotFoundError, ValueError):
            pass

    def save(self, force=False):
        if not (self.dirty or force) or (not force and time.time() - self.saved_at < 20):
            return
        with self.lock:
            data = json.dumps({"sizes": self.sizes, "ignore": self.ignore, "mirrors": self.mirrors})
            self.dirty, self.saved_at = False, time.time()
        tmp = self.path.with_suffix(".tmp"); tmp.write_text(data, encoding="utf-8"); tmp.replace(self.path)

    # ---------- taille
    def observe_size(self, camera, kind, size):
        if kind not in ("adulte", "enfant") or size is None or not (.3 < size < 3.5):
            return
        with self.lock:
            lst = self.sizes.setdefault(camera, {}).setdefault(kind, [])
            lst.append(round(size, 3)); del lst[:-300]
            self.dirty = True

    def child_max(self, camera):
        s = self.sizes.get(camera, {})
        a, e = s.get("adulte", []), s.get("enfant", [])
        if len(a) >= 15 and len(e) >= 15:
            return round((statistics.median(a) + statistics.median(e)) / 2, 3)
        if len(a) >= 15:
            return round(statistics.median(a) * .78, 3)      # un enfant est nettement plus petit qu'un adulte de la maison
        if len(e) >= 15:
            return round(statistics.median(e) * 1.3, 3)
        return DEFAULT_CHILD_MAX

    # ---------- corrections
    def forbid(self, camera, group, box):
        x, y = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        with self.lock:
            self.ignore.append({"camera": camera, "group": group, "x": round(x, 4), "y": round(y, 4), "r": .06, "t": round(time.time())})
            del self.ignore[:-200]
            self.dirty = True
        self.save(force=True)

    def ignored(self, camera, group, box):
        x, y = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        return any(i["camera"] == camera and i["group"] == group and abs(i["x"] - x) < i["r"] and abs(i["y"] - y) < i["r"] for i in self.ignore)

    def add_mirror(self, camera, box):
        with self.lock:
            self.mirrors.append({"camera": camera, "box": [round(float(v), 4) for v in box]})
            self.dirty = True
        self.save(force=True)

    def reflection(self, camera, box):
        """Silhouette entierement dans le cadre d'un miroir (pieds compris) : c'est un reflet."""
        for m in self.mirrors:
            if m["camera"] != camera:
                continue
            x1, y1, x2, y2 = m["box"]
            if box[0] >= x1 - .02 and box[2] <= x2 + .02 and box[1] >= y1 - .04 and box[3] <= y2 + .03:
                return True
        return False

    def reset(self):
        with self.lock:
            self.sizes, self.ignore, self.dirty = {}, [], True
        self.save(force=True)

    def public(self, cameras):
        out = {}
        for cid in cameras:
            s = self.sizes.get(cid, {})
            out[cid] = {"limite_enfant": self.child_max(cid), "mesures_adulte": len(s.get("adulte", [])), "mesures_enfant": len(s.get("enfant", [])),
                        "corrections": sum(1 for i in self.ignore if i["camera"] == cid), "miroirs": [m["box"] for m in self.mirrors if m["camera"] == cid]}
        return out
