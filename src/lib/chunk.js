// Da parole a riquadri: decide quali parole stanno sotto lo stesso simbolo.
//
//  - [maestra di piano](symbol:2457)  scelto dall'utente: sempre un riquadro a se'
//                                      (symbol:maestra = il simbolo della parola "maestra")
//  - "ho mangiato", "sto mangiando"    ausiliare + verbo -> simbolo di "mangiare"
//  - "mi lavo", "mi sono lavato"       riflessivo -> simbolo di "lavarsi" (se esiste)
//  - "olio di oliva"                   espressioni presenti nel vocabolario
//  - "la casa"                         l'articolo si appoggia alla parola dopo
//
// Riquadro: { start, core, end, keys, id, explicit, verb, tokens }
//   start..end  parole del riquadro;  core  prima parola dopo l'articolo
//   keys        parole chiave da cui prendere i simboli (la prima e' la migliore)

import { norm, has, lemmas, lemmaOf, isVerb, reflexive, candidates } from './lexicon.js'
import { isImage } from './md.js'

const ARTICLES = new Set(["il", "lo", "la", "l'", "i", "gli", "le", "un", "uno", "una", "un'"])
const REFLEXIVE = new Set(['mi', 'ti', 'si', 'ci', 'vi'])
const MAX_PHRASE = 4
const PARTICIPLE = /(?:at|ut|it)[oaie]$/
const GERUND = /[ae]ndo$/

const key = t => norm(t.w)
const free = t => t && t.id == null
const verbOf = k => { const l = lemmaOf(k); return l && isVerb(l) ? l : null }

// l'ausiliare accetta la parola dopo?  ho letto, sono andato (non "sono stanco"), sto leggendo
const AUX = {
  avere: k => true,
  essere: k => !has(k) || PARTICIPLE.test(k),
  stare: k => GERUND.test(k),
}

export function chunk(tokens, opt = {}) {
  const cards = []
  for (let i = 0; i < tokens.length;) {
    const c = cardAt(tokens, i, opt)
    cards.push(c)
    i = c.end
  }
  return cards
}

function cardAt(t, i, opt) {
  const k = key(t[i])
  if (opt.articles !== false && free(t[i]) && ARTICLES.has(k) && i + 1 < t.length) {
    const next = cardAt(t, i + 1, opt)
    if (!next.verb) return { ...next, start: i, tokens: t.slice(i, next.end) }
  }
  if (!free(t[i])) return make(t, i, i + 1, lemmas(k), t[i].id)
  const v = opt.verbs !== false && verbAt(t, i)
  if (v) return v
  for (let n = Math.min(MAX_PHRASE, t.length - i); n > 1; n--) {
    const part = t.slice(i, i + n)
    const p = norm(part.map(x => x.w).join(' '))
    if (part.every(free) && has(p)) return make(t, i, i + n, [p])
  }
  return make(t, i, i + 1, lemmas(k))
}

function verbAt(t, i) {
  let j = i
  const refl = REFLEXIVE.has(key(t[j])) && free(t[j + 1]) ? j++ : -1
  let verb = null, end = j + 1, keys = []
  const aux = verbOf(key(t[j]))
  const next = t[j + 1] && key(t[j + 1])
  if (aux in AUX && free(t[j + 1]) && verbOf(next) && AUX[aux](next)) {
    verb = verbOf(next); end = j + 2; keys = [verb, next]
  } else if (refl >= 0) {
    verb = verbOf(key(t[j]))
  }
  if (!verb) return null
  if (refl >= 0) {
    const r = reflexive(verb)
    if (!has(r)) return null          // "mi piace": il pronome resta un riquadro a se'
    keys = [r, verb]
  }
  return { ...make(t, refl >= 0 ? refl : i, end, keys.filter(has)), verb: true }
}

// explicit: id ARASAAC, id di immagine personale (img-...), 0 = nessuno, oppure una parola di cui usare il simbolo
function make(t, start, end, keys, explicit) {
  const word = typeof explicit === 'string' && !isImage(explicit)
  if (word) keys = lemmas(norm(explicit))
  const id = explicit != null && !word ? explicit || null : candidates(keys)[0] ?? null
  return { start, core: start, end, keys, id, explicit: explicit != null, verb: false, tokens: t.slice(start, end) }
}
