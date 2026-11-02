# /// script
# dependencies = ["qrcode[pil]"]
# ///
"""
Crea il QR code di un testo Parolina (.md), uguale a quello generato dall'app.

Il QR contiene un indirizzo:  <url dell'app>#t=<testo compresso zlib, base64url>
inquadrandolo con la fotocamera del telefono si apre direttamente l'app con il testo.

Uso:
    uv run scripts/qr_gen.py testo.md https://parolina.miosito.it/app/
    -> testo.png
"""
import base64
import sys
import zlib
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_L

if len(sys.argv) < 3:
    sys.exit(__doc__)

src, app_url = Path(sys.argv[1]), sys.argv[2]
text = src.read_text(encoding="utf-8")
if not text.strip():
    sys.exit(f"Errore: '{src}' e' vuoto.")

packed = base64.urlsafe_b64encode(zlib.compress(text.encode("utf-8"), 9)).decode("ascii").rstrip("=")
payload = f"{app_url}#t={packed}"

qr = qrcode.QRCode(error_correction=ERROR_CORRECT_L, box_size=10, border=4)
try:
    qr.add_data(payload)
    qr.make(fit=True)
except Exception:
    sys.exit("Errore: il testo e' troppo lungo per un solo QR code.")

out = src.with_suffix(".png")
qr.make_image(fill_color="black", back_color="white").save(out)

size = 17 + 4 * qr.version
print(f"Testo       : {len(text.encode('utf-8')):,} byte")
print(f"Nel QR      : {len(payload):,} caratteri (compresso)")
print(f"QR          : versione {qr.version} ({size}x{size} quadratini)")
print(f"Salvato     : {out}")
