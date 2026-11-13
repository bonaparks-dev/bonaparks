"""Voiture qui part sans portail appris, et voiture garee pendant la veille de la camera."""
import tempfile
from logbook import Logbook
rooms = {"dehors": {"name": "Jardin", "zone": "garden", "floor": "down"}}
with tempfile.TemporaryDirectory() as d:
    b = Logbook(d, rooms); t0 = 1_000_000.0
    car = lambda i, x: [{"id": i, "kind": "vehicule", "cameras": ["dehors"], "plan": [x, 500], "floor": "down", "edge": False}]
    for s in range(30): b.update(car(1, 300), t0 + s)                                  # garee
    b.update([], t0 + 31, asleep={"dehors"})                                          # la camera se met en veille
    b.update([], t0 + 600, asleep={"dehors"})
    print("pendant la veille :", [(o["kind"], o["status"]) for o in b.occupants.values()])
    for s in range(5): b.update(car(2, 300 - s * 30), t0 + 700 + s)                  # reveil : elle roule
    b.update([], t0 + 707)                                                            # disparait en roulant, portail jamais appris
    print("apres depart :", [(o["kind"], o["status"]) for o in b.occupants.values()])
    for e in b.journal: print(" ", e["qui"], "?", e["texte"])
