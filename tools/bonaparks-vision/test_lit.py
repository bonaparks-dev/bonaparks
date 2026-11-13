"""L'enfant marche dans la chambre, monte dans son lit, s'allonge, disparait sous la couverture."""
import json, tempfile
from logbook import Logbook
beds = json.load(open("config.json", encoding="utf-8-sig"))["beds"]
rooms = {"enfants": {"name": "Chambre des enfants", "zone": "children", "floor": "up"}}
with tempfile.TemporaryDirectory() as d:
    b = Logbook(d, rooms); b.beds = beds; t0 = 1_000_000.0
    kid = lambda x, y, pose="debout": [{"id": 1, "kind": "enfant", "cameras": ["enfants"], "plan": [x, y], "floor": "up", "edge": False, "pose": pose}]
    for s in range(10): b.update(kid(370, 420 + s), t0 + s)                      # marche dans la chambre
    for s in range(10, 20): b.update(kid(398, 480), t0 + s)                     # monte dans son lit
    for s in range(20, 60): b.update(kid(399, 481, "allonge"), t0 + s)          # s'allonge
    b.update([], t0 + 61)                                                      # disparait sous la couverture
    b.update([], t0 + 200)
    for e in b.journal: print(" ", e["heure"], e["texte"])
    print("statut :", [(o["status"], o.get("bed")) for o in b.occupants.values()])
