"""Scenario simule : la voiture se gare, le portail s'ouvre, la voiture part."""
import tempfile
from logbook import Logbook
rooms = {"dehors": {"name": "Jardin", "zone": "garden", "floor": "down"}}
with tempfile.TemporaryDirectory() as d:
    b = Logbook(d, rooms); t0 = 1_000_000.0
    car = lambda x, edge=False: [{"id": 5, "kind": "vehicule", "cameras": ["dehors"], "plan": [x, 500], "floor": "down", "edge": edge}]
    for s in range(0, 10): b.update(car(200 + s * 10), t0 + s)            # arrive
    for s in range(10, 40): b.update(car(290), t0 + s)                     # s'arrete -> gare
    b.event(t0 + 41, "Portail", "Jardin", "s'ouvre", "portail")
    for s in range(42, 46): b.update(car(290 - (s - 41) * 15), t0 + s, gate_open_at=t0 + 41, gate_state="ouvert")   # repart
    b.update([], t0 + 50, gate_open_at=t0 + 41, gate_state="ouvert")        # disparait, portail ouvert -> partie
    for e in b.journal: print(e["heure"], e["qui"], "·", e["texte"])
    print("encore la :", [(o["kind"], o["status"]) for o in b.occupants.values()])
