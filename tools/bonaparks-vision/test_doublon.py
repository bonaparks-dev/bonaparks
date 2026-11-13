"""Doublon : une 2e piste prend le relais de la meme personne, puis l'ancienne expire."""
import tempfile
from logbook import Logbook
rooms = {"enfants": {"name": "Chambre des enfants", "zone": "children", "floor": "up"}}
with tempfile.TemporaryDirectory() as d:
    b = Logbook(d, rooms); t0 = 1_000_000.0
    kid = lambda i, x: {"id": i, "kind": "enfant", "cameras": ["enfants"], "plan": [x, 500], "floor": "up", "edge": False}
    for s in range(10): b.update([kid(1, 360)], t0 + s)                        # piste 1
    for s in range(10, 16): b.update([kid(1, 360), kid(2, 380)], t0 + s)       # piste 2 apparait (meme enfant), la 1 traine
    for s in range(16, 25): b.update([kid(2, 380)], t0 + s)                    # la 1 expire
    print("presences :", [(o["kind"], o["status"]) for o in b.occupants.values()])
