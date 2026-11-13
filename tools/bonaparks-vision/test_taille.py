"""Verifie l'estimation de taille (adulte / enfant) sur les captures enregistrees, avec le calage actuel."""
import json
from pathlib import Path

import cv2
from ultralytics import YOLO

import bridge

HERE = Path(__file__).resolve().parent
cfg = bridge.load_config()
model = YOLO(str(HERE / cfg["model"]))
for spec, snap in ((c, HERE / f"snap_{c['channel']}.jpg") for c in cfg["cameras"]):
    if not snap.exists() or not spec.get("calibration"):
        continue
    cam = bridge.Camera(spec, "x", "u", "p", tuple(cfg["plan_size"]))
    frame = cv2.imread(str(snap))
    cam._prepare_calibration(frame.shape[1], frame.shape[0])
    r = model.predict(frame, classes=[0, 15, 16], conf=0.35, verbose=False)[0]
    for box, cls in zip(r.boxes.xyxy.tolist(), r.boxes.cls.tolist()):
        if int(cls) != 0:
            print(spec["name"], "animal", [round(v) for v in box])
            continue
        size, ok = cam.size_at(*box, frame.shape)
        print(spec["name"], "personne", "taille estimee", size, "m", "fiable" if ok else "coupee", "->", "enfant" if size < bridge.CHILD_MAX else "adulte", [round(v) for v in box])
