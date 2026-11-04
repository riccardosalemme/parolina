// Stato dell'app: impostazioni, testo aperto, testi recenti (nel localStorage del browser)

import { parse, title } from './md.js'
import { read, write } from './storage.js'

export const DEFAULTS = {
  mode: 'split',            // 'split' testo e simboli affiancati | 'write' scrivo sui simboli
  markdown: false,          // in 'split': mostra il markdown (utenti esperti) o solo il testo
  position: 'top',          // simbolo sopra ('top') o sotto ('bottom') la parola
  symbolSize: 110,
  textSize: 24,
  upper: false,             // testo in stampato maiuscolo
  frame: true,
  frameWidth: 2,
  frameColor: '#1f1a16',
  articles: true,           // "la casa" in un solo riquadro
  verbs: true,              // "ho mangiato" in un solo riquadro
  zoom: innerWidth < 600 ? 0.8 : 1,
}

export const settings = $state({ ...DEFAULTS, ...read('settings', {}) })
export const saveSettings = () => write('settings', settings)

// pick: simbolo aperto nel pannello { line, at };  select: riquadri scelti [{ line, at }] (null = selezione spenta)
export const ui = $state({ pick: null, dialog: null, toast: '', select: null })

const hit = (m, line, c) => m.line === line && c.start <= m.at && m.at < c.end
// riquadro evidenziato: scelto nella selezione o aperto nel pannello del simbolo
export const marked = (line, c) => (ui.select ?? (ui.pick ? [ui.pick] : [])).some(m => hit(m, line, c))
// con la selezione accesa: tocco su un riquadro, lo aggiungo o lo tolgo
export function tapSelect(line, c) {
  const n = ui.select.findIndex(m => hit(m, line, c))
  n < 0 ? ui.select.push({ line, at: c.core }) : ui.select.splice(n, 1)
}

let timer
export function toast(msg) {
  ui.toast = msg
  clearTimeout(timer)
  timer = setTimeout(() => (ui.toast = ''), 2600)
}

export const FULL = 'La memoria del browser è piena: elimina qualche testo o immagine.'

// --- testi recenti ---
// doc.name e' il nome scelto dall'utente; se e' vuoto il nome e' la prima riga del testo

// testo del primo avvio: ogni parola ha un simbolo
const WELCOME = `# Ciao!
Scrivi qui il tuo testo.
Sopra le parole c'è un **disegno**.
Tocca un disegno per cambiarlo.

Oggi vado al parco con la mamma.
Ieri ho mangiato una mela.`

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export const docName = d => d.name?.trim() || title(parse(d.md))

export const docs = $state(read('docs', []))       // [{ id, name, title, md, updated }], dal piu' recente

const first = docs.find(d => d.id === read('current')) ?? docs[0]
export const doc = $state(first ? { id: first.id, md: first.md, name: first.name ?? '' } : { id: newId(), md: WELCOME, name: '' })

const saveDocs = () => write('docs', docs) || toast(FULL)

export function saveDoc() {
  const n = docs.findIndex(d => d.id === doc.id)
  if (n >= 0 && docs[n].md === doc.md && (docs[n].name ?? '') === doc.name) return
  if (n >= 0) docs.splice(n, 1)
  if (doc.md.trim() || doc.name.trim())
    docs.unshift({ id: doc.id, name: doc.name, title: docName(doc), md: doc.md, updated: Date.now() })
  saveDocs()
  write('current', doc.id)
}

export function openDoc(id) {
  saveDoc()
  const d = docs.find(d => d.id === id)
  if (d) Object.assign(doc, { id: d.id, md: d.md, name: d.name ?? '' })
  write('current', doc.id)
}

export function newDoc(md = '', name = '') {
  saveDoc()
  Object.assign(doc, { id: newId(), md, name })
  saveDoc()
}

export function deleteDoc(id) {
  const n = docs.findIndex(d => d.id === id)
  if (n >= 0) docs.splice(n, 1)
  saveDocs()
  if (id === doc.id) newDoc()
}

// Aggiunge testi importati [{ md, name }] (senza doppioni), restituisce quanti
export function addDocs(list) {
  let added = 0
  for (const { md, name = '' } of list) {
    if (!md.trim() || docs.some(d => d.md === md)) continue
    docs.push({ id: newId(), name, title: docName({ md, name }), md, updated: Date.now() - docs.length })
    added++
  }
  docs.sort((a, b) => b.updated - a.updated)
  saveDocs()
  return added
}

// Variabili CSS del foglio dei simboli
export const sheetStyle = (s = settings) => [
  `--sym:${s.symbolSize}px`, `--txt:${s.textSize}px`,
  `--fw:${s.frame ? s.frameWidth : 0}px`, `--fc:${s.frameColor}`,
  `--dir:${s.position === 'top' ? 'column' : 'column-reverse'}`,
  `--align:${s.position === 'top' ? 'flex-start' : 'flex-end'}`,
  `--case:${s.upper ? 'uppercase' : 'none'}`, `--zoom:${s.zoom}`,
].join(';')
