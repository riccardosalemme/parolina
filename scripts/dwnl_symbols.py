# /// script
# dependencies = ["requests"]
# ///
"""
Scarica le immagini dei simboli indicizzati in public/symbols/<id>.png,
cosi' l'app puo' funzionare senza dipendere dal sito ARASAAC.

Uso:
    uv run scripts/dwnl_symbols.py          # dopo build_index.py
    uv run scripts/dwnl_symbols.py 500      # dimensione in pixel (300 default; 500, 2500)

Se lo interrompi e lo rilanci riparte da dove era arrivato.
"""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
WORKERS = 8
size = sys.argv[1] if len(sys.argv) > 1 else "300"
out_dir = ROOT / "public/symbols"
out_dir.mkdir(parents=True, exist_ok=True)

with open(ROOT / "public/data/index.json", "r", encoding="utf-8") as f:
    ids = [s["i"] for s in json.load(f)]

todo = [i for i in ids if not (out_dir / f"{i}.png").exists()]
print(f"{len(ids)} simboli, {len(todo)} da scaricare...")

session = requests.Session()


def download(symbol_id):
    url = f"https://static.arasaac.org/pictograms/{symbol_id}/{symbol_id}_{size}.png"
    try:
        r = session.get(url, timeout=30)
        r.raise_for_status()
    except Exception as e:
        return f"Errore per {symbol_id}: {e}"
    tmp = out_dir / f"{symbol_id}.part"
    tmp.write_bytes(r.content)
    tmp.rename(out_dir / f"{symbol_id}.png")  # mai file a meta' se si interrompe


with ThreadPoolExecutor(WORKERS) as pool:
    for n, err in enumerate(pool.map(download, todo), 1):
        if err:
            print(err)
        if n % 500 == 0:
            print(f"{n}/{len(todo)}")

print("Download completato!")
