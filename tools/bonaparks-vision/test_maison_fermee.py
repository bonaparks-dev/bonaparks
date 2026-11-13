"""Maison fermee : un seul enfant enregistre, personne n'est entre -> un 2e 'enfant' est un doublon."""
import tempfile
from logbook import Logbook
rooms = {"enfants": {"name": "Chambre", "zone": "children", "floor": "up"}, "dehors": {"name": "Jardin", "zone": "garden", "floor": "down"}}
with tempfile.TemporaryDirectory() as d:
    b = Logbook(d, rooms); b.caps = {"enfant": 1}; t0 = 1e6
    kid = lambda i, x, room="enfants": {"id": i, "kind": "enfant", "cameras": [room], "plan": [x, 480], "floor": "up", "edge": False}
    for s in range(5): b.update([kid(1, 398)], t0 + s)
    for s in range(5, 15): b.update([kid(1, 398), kid(2, 340)], t0 + s)       # 2e "enfant" (couverture, reflet...)
    print("affiches :", [(o["kind"], o["status"]) for o in b.snapshot()["occupants"]])
    b.caps = {"enfant": 2}                                                     # un enfant inconnu entre par le portail
    print("si un visiteur est entre :", len([o for o in b.snapshot()["occupants"]]) , "(apres mise a jour)")
    b.update([kid(1, 398), kid(2, 340)], t0 + 16); print("  ->", [(o["kind"], o["status"]) for o in b.snapshot()["occupants"]])
