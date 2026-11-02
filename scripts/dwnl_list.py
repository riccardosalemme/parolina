# /// script
# dependencies = ["requests"]
# ///
"""
Scarica l'elenco completo dei simboli ARASAAC in italiano.

Uso:
    uv run scripts/dwnl_list.py      # -> data/arasaac_it.json
"""
import json
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
URL = "https://api.arasaac.org/api/pictograms/all/it"
out = ROOT / "data/arasaac_it.json"
out.parent.mkdir(parents=True, exist_ok=True)

print("Scarico l'elenco dei simboli...")
resp = requests.get(URL, timeout=300)
resp.raise_for_status()
symbols = resp.json()

with open(out, "w", encoding="utf-8") as f:
    json.dump(symbols, f, ensure_ascii=False)

print(f"{len(symbols)} simboli -> {out}")
