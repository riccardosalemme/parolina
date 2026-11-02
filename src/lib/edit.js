// Modifiche al documento. Ogni funzione riceve le righe e restituisce righe nuove.

import { norm, lemmas, candidates } from './lexicon.js'

const copy = lines => lines.map(l => ({ kind: l.kind, tokens: l.tokens.map(t => ({ ...t })) }))
const style = (t, from) => { if (from?.b) t.b = true; if (from?.i) t.i = true; return t }
const explode = t => t.w.split(/\s+/).filter(Boolean).map(w => style({ w }, t))

export const words = (text, from) => text.split(/\s+/).filter(Boolean).map(w => style({ w }, from))

function update(lines, li, fn) {
  lines = copy(lines)
  fn(lines[li].tokens, lines)
  return lines
}

// Un solo simbolo (id; 0 = nessuno) per le parole del riquadro, articolo escluso
export const assign = (lines, li, card, id) => update(lines, li, t => {
  const part = t.slice(card.core, card.end)
  t.splice(card.core, part.length, style({ w: part.map(x => x.w).join(' '), id }, part[0]))
})

// Torna al simbolo scelto automaticamente
export const reset = (lines, li, card) => update(lines, li, t => {
  t.splice(card.core, card.end - card.core, ...t.slice(card.core, card.end).flatMap(explode))
})

// Il riquadro e quello dopo diventano uno solo
export const merge = (lines, li, card, next) => assign(lines, li, { ...card, end: next.end }, card.id ?? next.id ?? 0)

// Ogni parola del riquadro con il suo simbolo
export const split = (lines, li, card) => update(lines, li, t => {
  const parts = t.slice(card.start, card.end).flatMap(explode)
  if (parts.length > 1 || card.start < card.core)
    for (const p of parts) p.id = candidates(lemmas(norm(p.w)))[0] ?? 0
  t.splice(card.start, card.end - card.start, ...parts)
})

export const toggle = (lines, li, card, prop) => update(lines, li, t => {
  const on = !t.slice(card.start, card.end).every(x => x[prop])
  for (let n = card.start; n < card.end; n++) on ? (t[n][prop] = true) : delete t[n][prop]
})

export const setKind = (lines, li, kind) => update(lines, li, (t, l) => { l[li].kind = kind })

// --- scrittura sui simboli ---

export const insert = (lines, li, pos, tokens) => update(lines, li, (t, l) => {
  t.splice(pos, 0, ...tokens)
  if (l[li].kind === 'blank') l[li].kind = 'p'
})

export const remove = (lines, li, pos, n = 1) => update(lines, li, t => { t.splice(pos, n) })

// A capo: la riga si divide in due
export const breakLine = (lines, li, pos) => {
  lines = copy(lines)
  const l = lines[li]
  lines.splice(li + 1, 0, { kind: l.kind === 'li' ? 'li' : 'p', tokens: l.tokens.splice(pos) })
  return lines
}

// Cancella all'inizio della riga: si unisce a quella sopra
export const joinLines = (lines, li) => {
  lines = copy(lines)
  const [l] = lines.splice(li, 1)
  const prev = lines[li - 1]
  prev.tokens.push(...l.tokens)
  if (prev.kind === 'blank') prev.kind = l.kind === 'blank' ? 'p' : l.kind
  return lines
}

// Tasto "titolo": testo -> titolo -> sottotitolo -> ... -> testo;  tasto "elenco": acceso / spento
export const nextKind = (kind, what) =>
  what === 'li' ? (kind === 'li' ? 'p' : 'li') : ({ h1: 'h2', h2: 'h3', h3: 'p' })[kind] ?? 'h1'
