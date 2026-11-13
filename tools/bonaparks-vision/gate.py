"""Etat du portail, vu par une camera.

L'utilisateur repere le portail sur la video (4 points), puis montre a l'IA a quoi il ressemble "ferme" et "ouvert"
(plusieurs exemples possibles : jour, nuit, pluie). A chaque image, la zone du portail est comparee aux exemples :
structure de l'image (contours) plutot que couleurs, pour resister aux changements de lumiere et a la vision de nuit.
L'etat ne change qu'apres 2 secondes d'accord, pour ne pas reagir a une personne qui passe devant.
"""
import json
import time
from pathlib import Path

import cv2
import numpy as np

SIZE = (96, 64)


def signature(frame, roi):
    """Zone du portail redressee en rectangle, reduite a sa structure (gradients normalises)."""
    h, w = frame.shape[:2]
    src = np.float32([[x * w, y * h] for x, y in roi])
    dst = np.float32([[0, 0], [SIZE[0], 0], [SIZE[0], SIZE[1]], [0, SIZE[1]]])
    patch = cv2.warpPerspective(frame, cv2.getPerspectiveTransform(src, dst), SIZE)
    g = cv2.equalizeHist(cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY))
    gx, gy = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    sig = np.concatenate([cv2.GaussianBlur(np.abs(gx), (5, 5), 0).ravel(), cv2.GaussianBlur(np.abs(gy), (5, 5), 0).ravel()])
    sig -= sig.mean()
    return (sig / (np.linalg.norm(sig) + 1e-9)).astype(np.float32)


class Gate:
    def __init__(self, folder):
        self.path = Path(folder) / "portail.json"
        self.camera, self.roi, self.refs = None, None, []          # refs : [(etat, signature)]
        self.state, self.since, self.score = None, 0.0, 0.0
        self.pending, self.pending_since = None, 0.0
        self.opened_at = 0.0
        try:
            d = json.loads(self.path.read_text(encoding="utf-8"))
            self.camera, self.roi = d.get("camera"), d.get("roi")
            self.refs = [(r["etat"], np.float32(r["sig"])) for r in d.get("refs", [])]
            self.state = d.get("state")
        except (FileNotFoundError, ValueError):
            pass

    def save(self):
        d = {"camera": self.camera, "roi": self.roi, "state": self.state, "refs": [{"etat": e, "sig": s.tolist()} for e, s in self.refs]}
        tmp = self.path.with_suffix(".tmp"); tmp.write_text(json.dumps(d), encoding="utf-8"); tmp.replace(self.path)

    def set_roi(self, camera, roi):
        self.camera, self.roi, self.refs, self.state = camera, roi, [], None
        self.save()

    def learn(self, frame, etat):
        if self.roi is None or frame is None or etat not in ("ferme", "ouvert"):
            return False
        self.refs = (self.refs + [(etat, signature(frame, self.roi))])[-24:]
        self.state, self.since = etat, time.time()
        self.save()
        return True

    def update(self, frame, now):
        """Renvoie l'evenement 'ouvert' / 'ferme' quand l'etat change, sinon None."""
        if frame is None or self.roi is None or not {e for e, _ in self.refs} >= {"ferme", "ouvert"}:
            return None
        sig = signature(frame, self.roi)
        best = {}
        for e, s in self.refs:
            best[e] = max(best.get(e, -1.0), float(np.dot(sig, s)))
        guess = max(best, key=best.get)
        self.score = round(best[guess] - min(best.values()), 3)
        if self.score < .04:                 # trop proche des deux : on garde l'etat actuel
            guess = self.state
        if guess != self.state:
            if self.pending != guess:
                self.pending, self.pending_since = guess, now
            elif now - self.pending_since >= 2.0:
                self.state, self.since, self.pending = guess, now, None
                if guess == "ouvert":
                    self.opened_at = now
                self.save()
                return guess
        else:
            self.pending = None
        return None

    def public(self):
        etats = sorted({e for e, _ in self.refs})
        return {"camera": self.camera, "roi": self.roi, "state": self.state, "since": round(self.since), "score": self.score,
                "examples": {e: sum(1 for x, _ in self.refs if x == e) for e in ("ferme", "ouvert")},
                "ready": self.roi is not None and etats == ["ferme", "ouvert"]}
