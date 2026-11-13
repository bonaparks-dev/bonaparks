"""Scenario simule pour verifier le cahier de bord (dossier temporaire, la vraie memoire n'est pas touchee)."""
import tempfile

from logbook import Logbook

rooms = {"enfants": {"name": "Chambre des enfants", "zone": "children", "floor": "up"},
         "salon": {"name": "Salon", "zone": "living", "floor": "down"}}
with tempfile.TemporaryDirectory() as d:
    book = Logbook(d, rooms, {"still_after_s": 180, "hidden_sleep_after_s": 90})
    t0 = 1_000_000.0
    kid = lambda tid, room, x, y, edge=False: {"id": tid, "kind": "enfant", "cameras": [room], "plan": [x, y], "floor": "up" if room == "enfants" else "down", "edge": edge}
    book.update([kid(1, "enfants", 360, 500)], t0)                      # entre dans la chambre
    for s in range(1, 30):
        book.update([kid(1, "enfants", 360 + s, 500)], t0 + s)          # bouge un peu
    book.update([], t0 + 40)                                           # disparait au milieu de l'image (dans le lit)
    book.update([], t0 + 40 + 120)                                     # 2 min plus tard : dort probablement
    print("statut apres disparition :", [(o["kind"], o["room"], o["status"]) for o in book.occupants.values()])
    book.update([kid(7, "salon", 500, 300)], t0 + 4000)                # revu au salon le lendemain matin
    print("statut au salon :", [(o["kind"], o["room"], o["status"]) for o in book.occupants.values()])
    book.update([kid(7, "salon", 560, 300, edge=True)], t0 + 4001)
    book.update([], t0 + 4010)                                         # sort par le bord de l'image
    print("apres sortie :", [(o["kind"], o["room"], o["status"]) for o in book.occupants.values()])
    print("--- cahier")
    for e in book.journal:
        print(e["qui"], "·", e["piece"], "—", e["texte"])
