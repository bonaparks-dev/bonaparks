"""Place le mobilier de la chambre des enfants d'apres la camera : coins au sol reperes sur l'image -> plan -> metres de l'etage."""
import json
import numpy as np
import cv2
from pathlib import Path

cal = next(c for c in json.loads(Path(__file__).with_name("config.json").read_text(encoding="utf-8-sig"))["cameras"] if c["id"] == "enfants")["calibration"]
H, _ = cv2.findHomography(np.float32(cal["image"]), np.float32(cal["plan"]))   # coordonnees image normalisees -> plan

# coins au sol (image normalisee 0-1), lus sur la video de la camera de la chambre des enfants
FEET = {
    "lit_gauche": [(0.155, 0.78), (0.40, 0.87), (0.40, 0.36), (0.22, 0.30)],
    "lit_droit": [(0.53, 0.86), (0.71, 0.80), (0.65, 0.28), (0.48, 0.30)],
    "rangement": [(0.28, 0.27), (0.47, 0.24), (0.47, 0.20), (0.29, 0.22)],
    "tapis": [(0.40, 0.80), (0.53, 0.78), (0.50, 0.32), (0.40, 0.33)],
}
up_x = lambda u: (u - 329) * 0.03396 - 3.45          # plan -> metres de l'etage (meme repere que ub() dans maison3d.mjs)
up_y = lambda v: 4 - (v - 227) * 0.021227
room = (-3.45, -3.5, -0.6, 0.95)                     # chambre des enfants : x0, y0, x1, y1
for name, pts in FEET.items():
    plan = cv2.perspectiveTransform(np.float32([pts]), H)[0]
    xs, ys = [up_x(u) for u, _ in plan], [up_y(v) for _, v in plan]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    print(f"{name:10s} x {x0:6.2f} .. {x1:6.2f}  y {y0:6.2f} .. {y1:6.2f}   ({x1 - x0:.2f} x {y1 - y0:.2f} m)")
print("chambre    x", room[0], "..", room[2], " y", room[1], "..", room[3])
