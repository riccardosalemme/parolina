# AGENTS.md

Istruzioni per agenti di programmazione (e persone) che lavorano su **Parolina | CAA Facile**:
una web app per scrivere testi in CAA con i simboli ARASAAC. Leggi anche `README.md`.

## In breve

- Solo frontend statico: **niente backend**, niente database, niente account. Tutto gira nel browser.
- `/` homepage statica (`index.html`, `src/home.css`, `src/home.js`); `/app/` applicazione Svelte 5 (`app/index.html`, `src/main.js`).
- Dati dell'utente nel `localStorage` con prefisso `parolina:` (`src/lib/storage.js`).
- Python solo per preparare i dati (`scripts/`), sempre con **uv**.

## Comandi

```sh
npm install
npm run dev        # http://localhost:5173/ e /app/
npm test           # test della logica (node, senza browser): esegui sempre dopo una modifica a src/lib
npm run build      # dist/
npm run preview    # prova di dist/ (service worker attivo)
uv run scripts/<script>.py
```

Prima di consegnare: `npm test` e `npm run build` senza errori né warning.
Per le modifiche all'interfaccia controlla l'app in un browser (Chromium e Playwright sono adatti), anche a 390 px di larghezza e in tema scuro.

## Regole di stile

- **Codice essenziale**: poche righe, nessuna astrazione non necessaria, nessuna dipendenza nuova senza un motivo forte.
  Dipendenze attuali: svelte, vite, qrcode-generator, jsqr, @fontsource/atkinson-hyperlegible.
- **Lingua**: interfaccia e commenti in **italiano**; nomi di variabili e funzioni in inglese.
- Svelte 5 con le runes (`$state`, `$derived`, `$effect`, `$props`); stato condiviso nei file `*.svelte.js`.
- Indentazione 2 spazi, niente punto e virgola, apici singoli.
- `md.js`, `lexicon.js`, `chunk.js`, `edit.js`, `plain.js` sono testati in `tests/smoke.mjs` e devono restare **puri** (importabili da node):
  niente DOM, niente `import.meta.env`, niente import da file `.svelte.js`.
- Python: **uno script per funzione**, dipendenze dichiarate in testa con PEP 723 (`# /// script`), percorsi relativi alla radice del progetto, messaggi in italiano.
- Colori solo tramite le variabili di `src/theme.css` (`--accent`, `--brand`, `--ink`, ...): ogni colore deve funzionare in tema chiaro e scuro.
  Il foglio dei simboli (`.sheet`) è sempre bianco, come la carta.
- Interfaccia per ragazzi e utenti poco esperti: bersagli di almeno 44 px, testi brevi e chiari, niente gergo tecnico visibile.

## Formato del documento (non romperlo)

Un testo è markdown, una riga per blocco (`# `, `## `, `### `, `- `, riga vuota, testo).
Nel testo: `**grassetto**`, `_corsivo_`, e i link `[parole](symbol:X)` dove `X` è:
un id ARASAAC (numero), `0` (nessun simbolo), `img-...` (immagine personale) oppure una parola (usa il simbolo di quella parola).

- `parse()` e `serialize()` in `src/lib/md.js` devono fare andata e ritorno senza perdite.
- Le immagini personali nei `.md` scaricati stanno in fondo come `[img-...]: data:image/...;base64,...`; `absorb()` le salva e le toglie dal testo.
- I file di altri utenti e degli LLM devono continuare a funzionare: le modifiche al formato devono restare compatibili con il passato.

## Mappa del codice

| file | ruolo |
|---|---|
| `src/lib/md.js` | markdown ↔ righe `{ kind, tokens: [{ w, id?, b?, i? }] }` |
| `src/lib/lexicon.js` | carica `public/data/*.json`; parola → parole chiave (`lemmas`) → simboli (`candidates`) |
| `src/lib/chunk.js` | raggruppa i token in riquadri (articolo + nome, ausiliare + participio, riflessivi, espressioni) |
| `src/lib/edit.js` | modifiche immutabili alle righe (assegna simbolo, unisci, separa, scrittura) |
| `src/lib/plain.js` | modalità testo semplice: confronto parola per parola (LCS) che conserva simboli e stile |
| `src/lib/state.svelte.js` | impostazioni, testo aperto, testi recenti |
| `src/lib/images.svelte.js` | immagini personali: libreria, id dal contenuto, ritaglio, import/export |
| `src/lib/qr.js` | testo ↔ link `<app>#t=<zlib base64url>` ↔ QR (crea e leggi) |
| `src/lib/prompts.js` | prompt per i modelli di IA |
| `src/lib/theme.js` | tema chiaro / scuro / automatico (`parolina:theme`) |
| `src/lib/undo.svelte.js` | annulla / ripeti (le lettere scritte di fila sono un passo; `checkpoint()` prima di ogni azione) |
| `src/lib/feedback.js` | link al modulo Tally dei pareri (`VITE_FEEDBACK_URL` in `.env`) |
| `src/components/SplitView.svelte` | modo "testo e simboli" |
| `src/components/SymWriter.svelte` | modo "scrivi sui simboli" (cursore = riga + parole dopo il cursore) |
| `src/components/Picker.svelte` | pannello di scelta del simbolo |
| `src/components/Menu.svelte` | menu con le scritte, al posto dei tasti in alto sotto i 1100 px |

## Dati e licenze

- `public/data/index.json` e `forme.json` sono **generati** dagli script: non modificarli a mano.
- I pittogrammi ARASAAC sono CC BY-NC-SA: la citazione di ARASAAC deve restare visibile (homepage, impostazioni, stampa). Niente usi commerciali.
- Non aggiungere tracciamento, analytics o chiamate verso servizi esterni oltre a `static.arasaac.org`.
- Pareri: al modulo Tally vanno solo `source`, `word`, `symbol` (vedi `docs/modulo-tally.md`), mai il testo dell'utente.
  Se cambi i nomi dei parametri, aggiorna anche il modulo e quel documento.
