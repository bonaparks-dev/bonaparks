"""Test rapide : fabrique plan.jpg et lance l'IA sur les 3 captures."""
import time
from pathlib import Path

import cv2
from ultralytics import YOLO

HERE = Path(__file__).resolve().parent
SRC = HERE.parents[1] / "site" / "supranu" / "property_native_v25.webp"   # plan du site, dans le depot

img = cv2.imread(str(SRC))
cv2.imwrite(str(HERE / "plan.jpg"), cv2.resize(img, (1600, 1000), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 85])

model = YOLO(str(HERE / "yolo11m.pt"))
names = {0: "personne", 15: "chat", 16: "chien"}
for ch, label in ((2, "salon"), (1, "enfants"), (4, "dehors")):
    frame = cv2.imread(str(HERE / f"snap_{ch}.jpg"))
    t = time.time()
    r = model.predict(frame, classes=list(names), conf=0.35, verbose=False, device=0)[0]
    found = [f"{names[int(c)]} {cf:.2f}" for c, cf in zip(r.boxes.cls.tolist(), r.boxes.conf.tolist())]
    print(label, f"{(time.time() - t) * 1000:.0f} ms", found or "rien")
    cv2.imwrite(str(HERE / f"test_{label}.jpg"), r.plot())

