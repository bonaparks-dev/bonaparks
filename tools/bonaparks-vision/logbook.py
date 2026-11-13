"""Cahier de bord de la maison.

L'IA se souvient de qui est dans chaque piece, meme quand la camera ne le voit plus :
 - une presence qui disparait au milieu de l'image (pas par un bord) est toujours dans la piece : "hors de vue" ;
 - un enfant immobile, ou hors de vue dans une chambre, "dort probablement" ;
 - une presence ne quitte la piece que si elle sort par un bord de l'image, ou si elle est revue ailleurs.
Chaque changement est ecrit dans le cahier (journal.jsonl) et la memoire survit a un redemarrage (memoire.json).
"""
import json
import math
import time
from datetime import datetime
from pathlib import Path

LABEL = {"adulte": "Adulte", "enfant": "Enfant", "animal": "Animal", "vehicule": "Véhicule"}


class Logbook:
    def __init__(self, folder, rooms, settings=None):
        self.folder = Path(folder)
        self.rooms = rooms                      # camera id -> {"name", "zone", "floor"}
        s = settings or {}
        self.still_after = s.get("still_after_s", 180)       # immobile depuis 3 min -> dort (enfant)
        self.hidden_sleep_after = s.get("hidden_sleep_after_s", 90)
        self.forget_adult_after = s.get("forget_adult_after_s", 1800)
        self.forget_child_after = s.get("forget_child_after_s", 14 * 3600)
        self.bedrooms = set(s.get("bedrooms", ["children"]))
        self.occupants = {}                     # occupant id -> dict
        self.beds = []                          # [{room, name, rect:[u0,v0,u1,v1]}] en unites du plan
        self.caps = {}                          # type -> nombre maximum possible dans la maison (maison fermee)
        self.journal = []
        self.next_id = 1
        self._load()

    # ---------- persistance
    def _load(self):
        try:
            m = json.loads((self.folder / "memoire.json").read_text(encoding="utf-8"))
            self.occupants = {int(k): v for k, v in m.get("occupants", {}).items()}
            for o in self.occupants.values():
                o["track"] = None               # les pistes ne survivent pas a un redemarrage
                if o["status"] == "visible":
                    o["status"] = "hors de vue"
                if not o.get("hidden_since"):
                    o["hidden_since"] = time.time()      # apres un redemarrage : on repart de maintenant
            self.next_id = m.get("next_id", 1)
        except (FileNotFoundError, ValueError):
            pass
        try:
            lines = (self.folder / "journal.jsonl").read_text(encoding="utf-8").splitlines()[-200:]
            self.journal = [json.loads(l) for l in lines if l.strip()]
        except FileNotFoundError:
            pass

    def _save(self):
        tmp = self.folder / "memoire.json.tmp"
        tmp.write_text(json.dumps({"occupants": self.occupants, "next_id": self.next_id}, ensure_ascii=False), encoding="utf-8")
        tmp.replace(self.folder / "memoire.json")

    def log(self, now, occ, text, level="info"):
        e = {"t": round(now), "oid": occ.get("id"), "heure": datetime.fromtimestamp(now).strftime("%H:%M"), "qui": occ.get("name") or LABEL.get(occ["kind"], occ["kind"]),
             "kind": occ["kind"], "piece": self.rooms.get(occ["room"], {}).get("name", occ["room"]), "texte": text, "niveau": level}
        self.journal = (self.journal + [e])[-200:]
        with open(self.folder / "journal.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    def event(self, now, qui, piece, texte, kind="info"):
        """Evenement sans personne (portail...)."""
        e = {"t": round(now), "oid": None, "heure": datetime.fromtimestamp(now).strftime("%H:%M"), "qui": qui, "kind": kind, "piece": piece, "texte": texte, "niveau": "info"}
        self.journal = (self.journal + [e])[-200:]
        with open(self.folder / "journal.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    # ---------- mise a jour a chaque tour de l'IA
    def update(self, tracks, now, gate_open_at=0.0, gate_state=None, asleep=()):
        changed = False
        gate_recent = gate_state == "ouvert" or now - gate_open_at < 90
        live_ids = {t["id"] for t in tracks}
        by_track = {o["track"]: o for o in self.occupants.values() if o.get("track") is not None}
        for t in tracks:
            room = t["cameras"][0] if t["cameras"] else None
            if room is None:
                continue
            o = by_track.get(t["id"])
            if o is None:
                o = self._attach(t, room, now)
                if o is None:
                    continue
                changed = True
            if t.get("who") and o.get("who") != t["who"]:
                self.name(o, {"id": t["who"], "name": t.get("name"), "kind": t["kind"], "color": t.get("color")}, now, quiet=bool(o.get("who")))
            if o.get("who"):
                o["kind"] = t["kind"]           # profil enregistre : type fige
            elif o["kind"] != t["kind"]:
                o["kv"] = o.get("kv", 0) + 1    # inconnu : on ne change de type qu'apres ~5 s de desaccord continu
                if o["kv"] > 25:
                    self.log(now, o, f"reconnu comme {LABEL.get(t['kind'], t['kind']).lower()}")
                    o["kind"], o["kv"] = t["kind"], 0
            else:
                o["kv"] = 0
            if o["room"] != room:
                self.log(now, o, f"passe de {self.rooms.get(o['room'], {}).get('name', o['room'])} à {self.rooms.get(room, {}).get('name', room)}")
                o["room"] = room
                changed = True
            o.update(track=t["id"], plan=t["plan"], floor=t["floor"], last_seen=now, edge=t.get("edge", False), pose=t.get("pose"), match=t.get("match"))
            if t.get("colors"):
                o["colors"] = {**o.get("colors", {}), **t["colors"]}
            # immobilite : un enfant qui ne bouge plus s'endort
            if math.dist(o.get("still_at", t["plan"]), t["plan"]) > 18:
                o["still_at"], o["still_since"] = t["plan"], now
                if o["status"] == "dort" and o["kind"] != "vehicule":
                    o["status"] = "visible"
                    self.log(now, o, "se réveille, de nouveau en mouvement")
                    changed = True
            if o["status"] == "hors de vue":
                o["status"] = "visible"
                self.log(now, o, "de nouveau visible")
                changed = True
            # les lits : on voit l'enfant monter dans son lit, s'y endormir et en sortir
            bed = self.bed_at(o["room"], t["plan"])
            if bed != o.get("bed"):
                if bed:
                    self.log(now, o, f"monte dans {bed}")
                elif o.get("bed") and o["status"] != "dort":
                    self.log(now, o, f"sort de {o['bed']}")
                o["bed"], o["bed_since"] = bed, now
                changed = True
            if o["kind"] == "enfant" and bed and o["status"] == "visible" and (
                    (o.get("pose") == "allonge" and now - o.get("bed_since", now) > 30) or now - o.get("still_since", now) > 120):
                o["status"] = "dort"
                self.log(now, o, f"s'endort dans {bed}", "calme")
                changed = True
            if o["kind"] == "vehicule":          # un vehicule arrete est gare ; il repart quand il bouge
                if o["status"] == "visible" and now - o.get("still_since", now) > 20:
                    o["status"] = "garé"; self.log(now, o, "est garé", "calme"); changed = True
                elif o["status"] == "garé" and now - o.get("still_since", now) < 2:
                    o["status"] = "visible"; self.log(now, o, "démarre"); changed = True
            if (o["kind"] == "enfant" and o["status"] == "visible" and now - o.get("still_since", now) > (60 if o.get("pose") == "allonge" else self.still_after)):
                o["status"] = "dort"
                self.log(now, o, "immobile depuis plusieurs minutes, dort probablement", "calme")
                changed = True
        # presences qui ne sont plus vues
        for oid, o in list(self.occupants.items()):
            if o.get("track") is not None and o["track"] not in live_ids:
                o["track"] = None
                if o["room"] in asleep:          # la camera s'est mise en veille : rien n'a change, on ne conclut rien
                    o["hidden_since"] = None
                    continue
                fam = lambda k: "personne" if k in ("adulte", "enfant") else k
                twin = [x for x in self.occupants.values() if x is not o and x.get("track") is not None and x["room"] == o["room"]
                        and fam(x["kind"]) == fam(o["kind"]) and x.get("since", 0) >= o.get("last_seen", now) - 10
                        and (not o.get("who") or not x.get("who") or x.get("who") == o.get("who"))]
                if twin:                         # une nouvelle piste a pris le relais juste avant : c'est la meme personne
                    x = twin[0]
                    x["since"] = min(x.get("since", now), o.get("since", now))
                    for k in ("who", "name", "color"):
                        if o.get(k) and not x.get(k):
                            x[k] = o[k]
                    if o.get("who"):
                        x["kind"] = o["kind"]
                    for e in self.journal:       # son historique suit
                        if e.get("oid") == oid:
                            e["oid"] = x["id"]
                    del self.occupants[oid]
                    changed = True
                    continue
                moving = now - o.get("still_since", now) < 6 and o["status"] != "garé"
                if o["kind"] == "vehicule" and (o.get("edge") or gate_recent or moving):
                    self.log(now, o, "est parti" + (" par le portail" if gate_recent else ""))
                    del self.occupants[oid]
                elif o.get("edge"):
                    self.log(now, o, "est sorti du champ de la caméra, a quitté la pièce")
                    del self.occupants[oid]
                else:
                    if o["status"] != "dort":
                        o["status"] = "hors de vue"
                        self.log(now, o, "masqué, toujours là (le portail est resté fermé)" if o["kind"] == "vehicule" else "n'est plus visible mais n'est pas sorti : toujours dans la pièce")
                    o["hidden_since"] = now
                changed = True
                continue
            if o.get("track") is None and oid in self.occupants:
                if o["room"] in asleep or o.get("hidden_since") is None:
                    continue                    # camera en veille : le souvenir reste tel quel
                hidden = now - o.get("hidden_since", now)
                bedroom = self.rooms.get(o["room"], {}).get("zone") in self.bedrooms
                if not o.get("bed") and o.get("plan"):
                    o["bed"] = self.bed_at(o["room"], o["plan"])
                if o["status"] == "hors de vue" and o["kind"] == "enfant" and o.get("bed") and hidden > 45:
                    o["status"] = "dort"
                    self.log(now, o, f"ne bouge plus, caché dans {o['bed']} : il dort", "calme")
                    changed = True
                if o["status"] == "hors de vue" and o["kind"] == "enfant" and bedroom and hidden > self.hidden_sleep_after:
                    o["status"] = "dort"
                    self.log(now, o, "hors de vue dans son lit, dort probablement", "calme")
                    changed = True
                limit = self.forget_child_after if o["kind"] == "enfant" else 180 if o["kind"] == "vehicule" else self.forget_adult_after
                if hidden > limit:
                    self.log(now, o, "n'a pas été revu depuis longtemps, retiré de la mémoire")
                    del self.occupants[oid]
                    changed = True
        # maison fermee : pas plus de presences d'un type que de membres (et de visiteurs entres par le portail)
        for kind, cap in self.caps.items():
            same = [o for o in self.occupants.values() if o["kind"] == kind]
            for o in same:
                o.pop("dup", None)
            if len(same) <= cap:
                continue
            same.sort(key=lambda o: (o.get("who") is not None, o.get("track") is not None, o.get("last_seen", 0)), reverse=True)
            keep = same[0]
            for o in same[cap:]:
                if o.get("track") is not None:
                    o["dup"] = True                     # vue en double : cachee tant que sa piste vit
                else:
                    keep["since"] = min(keep.get("since", now), o.get("since", now))
                    for e in self.journal:
                        if e.get("oid") == o["id"]:
                            e["oid"] = keep["id"]
                    self.occupants.pop(o["id"], None)
                    changed = True
        if changed:
            self._save()

    def name(self, o, prof, now=None, quiet=False):
        """Rattache une presence a un profil enregistre (nom, type fige, couleur)."""
        for k, other in list(self.occupants.items()):   # la meme personne n'existe qu'une fois : l'ancien souvenir est fusionne
            if other is not o and other.get("who") == prof["id"] and other.get("track") is None:
                o["since"] = min(o.get("since", now or time.time()), other.get("since", o.get("since", 0)))
                del self.occupants[k]
        o.update(who=prof["id"], name=prof.get("name"), color=prof.get("color"))
        if prof.get("kind"):
            o["kind"] = prof["kind"]
        if not quiet:
            self.log(now or time.time(), o, "reconnu")
        self._save()

    def unname(self, pid):
        for o in self.occupants.values():
            if o.get("who") == pid:
                o.update(who=None, name=None, color=None)
        self._save()

    def _attach(self, t, room, now):
        """Une piste apparait : est-ce quelqu'un dont on se souvient ?"""
        if t.get("who"):                 # reconnu : c'est la meme personne, ou qu'elle ait ete vue la derniere fois
            known = [o for o in self.occupants.values() if o.get("who") == t["who"]]
            if known:
                return known[0]
        family = lambda k: "personne" if k in ("adulte", "enfant") else k
        # meme piece : une personne qui reapparait est celle qu'on avait perdue de vue, meme si l'IA hesite sur adulte / enfant
        here = [o for o in self.occupants.values() if o.get("track") is None and o["room"] == room and family(o["kind"]) == family(t["kind"])
                and (not o.get("who") or o.get("who") == t.get("who"))]
        if here:
            return min(here, key=lambda o: math.dist(o["plan"], t["plan"]))
        if t["kind"] == "animal" and t.get("travel", 0) < 20:
            return None                  # un "animal" qui n'a jamais bouge : sans doute une peluche, pas encore enregistre
        hidden = [o for o in self.occupants.values() if o.get("track") is None and o["kind"] == t["kind"] and (not o.get("who") or o.get("who") == t.get("who"))]
        here = [o for o in hidden if o["room"] == room]
        if here:      # meme piece : la personne hors de vue reapparait
            o = min(here, key=lambda o: math.dist(o["plan"], t["plan"]))
            return o
        hidden = [o for o in hidden if now - o.get("hidden_since", now) >= 8   # changer de piece prend du temps : pas de saut instantane
                  and (o["status"] != "dort" or (t.get("who") and o.get("who") == t.get("who")))]   # qui dort ne change pas de piece sans etre reconnu
        if hidden:    # ailleurs : elle a change de piece sans etre vue sortir
            o = min(hidden, key=lambda o: o.get("hidden_since", now))
            return o
        o = {"id": self.next_id, "kind": t["kind"], "room": room, "status": "visible", "since": now, "plan": t["plan"],
             "floor": t["floor"], "track": t["id"], "still_at": t["plan"], "still_since": now, "last_seen": now, "first_room": room}
        self.next_id += 1
        self.occupants[o["id"]] = o
        self.log(now, o, "arrive dans la pièce")
        return o

    def bed_at(self, room, plan):
        for b in self.beds:
            u0, v0, u1, v1 = b["rect"]
            if b["room"] == room and min(u0, u1) - 4 <= plan[0] <= max(u0, u1) + 4 and min(v0, v1) - 4 <= plan[1] <= max(v0, v1) + 4:
                return b["name"]
        return None

    def snapshot(self):
        occ = [{k: o.get(k) for k in ("id", "kind", "room", "status", "plan", "floor", "since", "last_seen", "who", "name", "color", "pose", "bed", "match", "colors")}
               for o in self.occupants.values() if not o.get("dup")]
        return {"occupants": occ, "journal": self.journal[-40:]}
