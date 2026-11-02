# /// script
# dependencies = []
# ///
"""
Crea public/data/index.json (compatto) dall'elenco ARASAAC scaricato.

Uso:
    uv run scripts/build_index.py                 # legge data/arasaac_it.json
    uv run scripts/build_index.py altro.json

Ogni voce:  {"i": id, "k": [parole chiave], "p": [plurali], "a": 0|1, "v": 0|1}
  i = id del pittogramma (file: public/symbols/<id>.png)
  k = parole chiave (la prima e' la principale)
  p = plurali
  a = 1 se il simbolo e' pensato per la CAA
  v = 1 se almeno una parola chiave e' un verbo
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERB = 3  # tipo "verbo" nelle keyword ARASAAC

src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data/arasaac_it.json"
out = ROOT / "public/data/index.json"
out.parent.mkdir(parents=True, exist_ok=True)

with open(src, "r", encoding="utf-8") as f:
    symbols = json.load(f)

index = []
skipped = 0
for s in symbols:
    # escludo i simboli marcati come sessuali o violenti
    if s.get("sex") or s.get("violence"):
        skipped += 1
        continue
    kws, plurals, verb = [], [], 0
    for k in s.get("keywords", []):
        w = (k.get("keyword") or "").strip()
        if not w:
            continue
        kws.append(w)
        p = (k.get("plural") or "").strip()
        if p:
            plurals.append(p)
        if k.get("type") == VERB:
            verb = 1
    if kws:
        index.append({"i": s["_id"], "k": kws, "p": plurals, "a": int(bool(s.get("aac"))), "v": verb})

with open(out, "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, separators=(",", ":"))

print(f"{len(index)} simboli indicizzati ({skipped} esclusi) -> {out}")
