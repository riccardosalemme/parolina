// Da dove prendere le immagini dei simboli: dal sito ARASAAC o dalla cartella public/symbols
// (scaricata con scripts/dwnl_symbols.py). Lo sceglie chi pubblica l'app con VITE_SYMBOLS=local (nel file .env);
// di default ARASAAC. L'utente non puo' cambiarlo.

// L'app vive in /app/: i dati (data/, symbols/, sw.js) sono nella cartella sopra
export const ROOT = new URL('../', document.baseURI).href

const LOCAL = import.meta.env.VITE_SYMBOLS === 'local'

export const remote = id => `https://static.arasaac.org/pictograms/${id}/${id}_300.png`

export const symbolUrl = id => LOCAL ? `${ROOT}symbols/${id}.png` : remote(id)

export { isImage } from './md.js'
