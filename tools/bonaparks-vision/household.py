"""Qui est-ce, en pourcentage : vetements, cheveux, taille, visage, et logique de presence.

Logique de presence (maison fermee) : la seule entree est le portail. Si aucun inconnu n'est entre par la, une
personne vue dans la maison est forcement un membre du foyer ; s'il n'y a qu'un enfant enregistre, un enfant vu est
"surement lui". Chaque indice disponible pousse la probabilite vers oui ou vers non (combinaison bayesienne simple).
"""
import math

import cv2
import numpy as np

WEIGHT = {"visage": 3.0, "vetements": 1.2, "cheveux": .8, "taille": 1.0}


def hair(frame, box):
    """Couleur des cheveux : haut de la tete (14 % du haut du cadre, centre)."""
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = box
    bw, bh = x2 - x1, y2 - y1
    crop = frame[int(max(0, y1)):int(min(h, y1 + bh * .14)), int(max(0, x1 + bw * .28)):int(min(w, x2 - bw * .28))]
    if crop.size < 90:
        return None
    hist = cv2.calcHist([cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)], [0, 1, 2], None, [8, 4, 4], [0, 180, 0, 256, 0, 256]).flatten()
    return (hist / (hist.sum() + 1e-9)).astype(np.float32)


def _corr(samples, x):
    if x is None or not samples:
        return None
    best = sorted((float(cv2.compareHist(s, x, cv2.HISTCMP_CORREL)) for s in samples), reverse=True)[:3]
    return float(np.mean(best))


def cues(prof, t):
    """Indices disponibles pour ce profil et cette piste, chacun entre 0 (non) et 1 (oui)."""
    out = {}
    c = _corr(prof.get("looks"), t.get("look_last"))
    if c is not None:
        out["vetements"] = min(1, max(0, (c - .25) / .6))
    c = _corr(prof.get("hairs"), t.get("hair_last"))
    if c is not None:
        out["cheveux"] = min(1, max(0, (c - .25) / .6))
    sizes, hs = t.get("size_hist") or [], prof.get("heights") or []
    if sizes and len(hs) >= 3:
        d = float(np.median(sizes)) - float(np.median(hs))
        out["taille"] = math.exp(-(d / .2) ** 2 / 2)
    f = (t.get("face_hits") or {}).get(prof["id"])
    if f is not None:
        out["visage"] = min(1, max(0, (f - .25) / .35))
    return out


def probability(prior, found):
    """Combine la logique de presence (a priori) et les indices."""
    prior = min(.97, max(.03, prior))
    logit = math.log(prior / (1 - prior))
    for k, s in found.items():
        logit += WEIGHT[k] * (s - .5) * 2.2
    return 1 / (1 + math.exp(-logit))
