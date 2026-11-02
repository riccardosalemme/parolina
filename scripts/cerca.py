# /// script
# dependencies = ["rich"]
# ///
"""
Cerca una parola tra i simboli scaricati e mostra id, parole chiave e indirizzo.

Uso:
    uv run scripts/cerca.py casa
"""
import json
import sys
from pathlib import Path

from rich import print

ROOT = Path(__file__).resolve().parents[1]

if len(sys.argv) < 2:
    sys.exit(__doc__)
search = " ".join(sys.argv[1:]).lower()

with open(ROOT / "data/arasaac_it.json", "r", encoding="utf-8") as f:
    sym = json.load(f)

for x in sym:
    keys = [(y.get("keyword") or "").lower() for y in x.get("keywords", [])]
    plurals = [(y.get("plural") or "").lower() for y in x.get("keywords", [])]
    if search in keys or search in plurals:
        id = x.get("_id")
        aac = " [green]caa[/green]" if x.get("aac") else ""
        print(f"[bold]{id}[/bold]{aac}  {', '.join(keys)}")
        print(f"   https://static.arasaac.org/pictograms/{id}/{id}_300.png")
