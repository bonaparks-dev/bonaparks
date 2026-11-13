"""Essai simule : le type et la position restent stables malgre des erreurs de l'IA."""
import random
import tempfile

import bridge
from identity import Profiles

random.seed(1)
with tempfile.TemporaryDirectory() as d:
    tr = bridge.Tracker(45, Profiles(d))
    kinds, xs, t = [], [], 1000.0
    for i in range(50):
        t += .2
        group = "animal" if i == 20 else "personne"                 # une fois prise pour un animal
        kind = "animal" if group == "animal" else ("enfant" if random.random() < .3 else "adulte")   # 30 % d'erreurs
        x = 500 + i * .5 + random.uniform(-6, 6)                     # tremblement du cadre
        if i == 30:
            x += 120                                                 # un saut isole (mauvais cadre)
        obs = [{"kind": kind, "group": group, "reliable": True, "edge": False, "conf": .8, "plan": [x, 300], "camera": "salon", "floor": "down"}]
        out = tr.update(obs, t)
        if out:
            kinds.append(out[0]["kind"]); xs.append(out[0]["plan"][0])
    changes = sum(1 for a, b in zip(kinds, kinds[1:]) if a != b)
    print("types affiches :", sorted(set(kinds)), "· changements de type :", changes)
    print("plus grand pas affiche :", round(max(abs(b - a) for a, b in zip(xs, xs[1:])), 1), "unites (le saut isole etait de 120)")
    print("presences affichees a la fin :", len(out))
