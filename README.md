<p align="center">
  <img src="public/icon.svg" alt="Parolina" width="120" />
</p>

<h3 align="center">Parolina</h3>

<p align="center"><b>CAA Facile</b>: scrivi testi con i <b>simboli ARASAAC</b>, una parolina alla volta. Tutto nel browser, senza account.</p>

<p align="center">
  <img src="https://img.shields.io/badge/licenza-MIT-f08a5d?style=for-the-badge" alt="Licenza MIT" />
  <img src="https://img.shields.io/badge/Svelte-5-f08a5d?style=for-the-badge&logo=svelte&logoColor=white" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/PWA-offline-f08a5d?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/simboli-ARASAAC-f08a5d?style=for-the-badge" alt="Simboli ARASAAC" />
</p>

Web app per scrivere testi in **CAA** (Comunicazione Aumentativa Alternativa) con i simboli **ARASAAC**.
Scrivi come sempre e sopra ogni parola compare il suo simbolo, anche per i verbi coniugati.
Solo frontend statico: niente backend, niente account, i testi restano nel browser.

## Funzionalità

- **Simboli automatici** per oltre 13.600 pittogrammi ARASAAC in italiano, anche per verbi coniugati, plurali e femminili.
- **Due modi di scrivere**: testo e simboli affiancati, oppure direttamente sui simboli.
- **Simboli su misura**: cambia, togli, unisci o separa i simboli; usa le tue immagini.
- **Impostazioni**: posizione e grandezza dei simboli, riquadro, maiuscolo, zoom, tema chiaro / scuro.
- **I miei testi**: salvati nel browser, con importazione ed esportazione.
- **QR code, stampa e PDF**.
- **Prompt per l'IA** per scrivere testi o disegnare simboli mancanti.
- **PWA**: si installa e funziona anche offline.

## Installazione in locale

Servono **Node.js 22** e, per gli script, **[uv](https://docs.astral.sh/uv/)**.

```sh
npm install
npm run dev        # http://localhost:5173/ (homepage) e /app/ (app)
npm test           # test della logica
npm run build      # versione da pubblicare in dist/
npm run preview    # prova di dist/ su http://localhost:4173
```

Le immagini dei simboli arrivano da `static.arasaac.org`.
Per usare la cartella locale `public/symbols/` imposta `VITE_SYMBOLS=local` nel file `.env`.

## Script

Servono solo per rigenerare i dati (il vocabolario in `public/data/` è già incluso).
Ogni script dichiara le sue dipendenze (PEP 723): basta `uv run`, dalla radice del progetto.
Per aggiornare il vocabolario lanciali in quest'ordine: `dwnl_list.py`, `build_index.py`, `build_forme.py`.

| script | cosa fa |
|---|---|
| `uv run scripts/dwnl_list.py` | scarica l'elenco dei simboli in italiano → `data/arasaac_it.json` |
| `uv run scripts/build_index.py` | crea il vocabolario → `public/data/index.json` |
| `uv run scripts/build_forme.py` | crea le forme flesse (verbi, femminili, plurali) → `public/data/forme.json` |
| `uv run scripts/dwnl_symbols.py` | scarica le immagini → `public/symbols/<id>.png` |
| `uv run scripts/qr_gen.py testo.md https://esempio.org/app/` | crea il QR code di un testo |
| `uv run scripts/cerca.py casa` | cerca una parola tra i simboli |

## Licenza dei simboli

> Pittogrammi: Sergio Palao. Origine: ARASAAC (https://arasaac.org). Licenza: CC (BY-NC-SA). Proprietà: Governo d'Aragona (Spagna).
