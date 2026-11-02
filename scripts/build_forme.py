# /// script
# dependencies = ["simplemma"]
# ///
"""
Crea public/data/forme.json: le forme flesse (verbi coniugati, femminili, plurali...)
che portano a una parola chiave presente nell'indice.

I simboli ARASAAC esistono solo per l'infinito (mangiare) e per il maschile
singolare (bello): questo file permette all'app di trovare il simbolo anche
per "mangiavo", "ho mangiato", "belle"...

Uso:
    uv run scripts/build_forme.py     # dopo build_index.py

Formato:  {"v": {"mangiare": "mangio mangi mangia ..."}, "a": {"bello": "bella belli belle"}}
  v = verbi, a = altre parole
"""
import json
from pathlib import Path

from simplemma.strategies.dictionaries import DefaultDictionaryFactory

ROOT = Path(__file__).resolve().parents[1]
src = ROOT / "public/data/index.json"
out = ROOT / "public/data/forme.json"

with open(src, "r", encoding="utf-8") as f:
    index = json.load(f)

keys, verbs = set(), set()
for s in index:
    for w in s["k"] + s["p"]:
        keys.add(w.lower())
    if s["v"]:
        verbs.update(w.lower() for w in s["k"])

lemmi = DefaultDictionaryFactory().get_dictionary("it")

forme = {"v": {}, "a": {}}
for form, lemma in lemmi.items():
    form, lemma = form.lower(), lemma.lower()
    if form == lemma or lemma not in keys or " " in form:
        continue
    is_verb = lemma in verbs
    # una parola che ha gia' un suo simbolo resta com'e', salvo che sia una voce verbale
    if form in keys and not is_verb:
        continue
    group = forme["v" if is_verb else "a"].setdefault(lemma, set())
    group.add(form)

for kind in forme:
    forme[kind] = {k: " ".join(sorted(v)) for k, v in sorted(forme[kind].items())}

with open(out, "w", encoding="utf-8") as f:
    json.dump(forme, f, ensure_ascii=False, separators=(",", ":"))

n = sum(len(v.split()) for d in forme.values() for v in d.values())
print(f"{len(forme['v'])} verbi, {len(forme['a'])} altre parole, {n} forme -> {out}")
