// Vocabolario: parola -> simboli ARASAAC
//
// index.json  (scripts/build_index.py)  i simboli con parole chiave e plurali
// forme.json  (scripts/build_forme.py)  forme flesse -> parola chiave
//                                       (mangiavo -> mangiare, belle -> bello)

const byKey = new Map()    // parola -> [{ id, rank, aac }]
const lemma = new Map()    // forma flessa -> parola chiave
const verbs = new Set()    // parole chiave che sono verbi
const folded = new Map()   // parola senza accenti -> parola chiave
let words = []             // [{ n, label, id }] per la ricerca libera
export let size = 0

// minuscolo, senza punteggiatura attorno; l'apostrofo finale resta (l', po', e')
export const norm = s => s.toLowerCase().replace(/[’`´]/g, "'")
  .replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}']+$/u, '')
const fold = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/'$/, '')

export async function load(base) {
  const get = f => fetch(base + f).then(r => { if (!r.ok) throw new Error(f); return r.json() })
  const [index, forme] = await Promise.all([get('data/index.json'), get('data/forme.json')])

  const add = (w, id, rank, aac) => {
    const k = norm(w)
    if (!k) return
    if (!byKey.has(k)) byKey.set(k, [])
    const list = byKey.get(k)
    if (!list.some(x => x.id === id)) list.push({ id, rank, aac })
  }
  for (const s of index) {
    s.k.forEach((w, n) => { add(w, s.i, n, s.a); words.push({ n: norm(w), label: w, id: s.i }) })
    s.p.forEach(w => add(w, s.i, 5, s.a))
    if (s.v) s.k.forEach(w => verbs.add(norm(w)))
  }
  // prima la parola chiave principale, poi i simboli pensati per la CAA
  for (const list of byKey.values()) list.sort((a, b) => a.rank - b.rank || b.aac - a.aac || a.id - b.id)
  for (const k of byKey.keys()) if (!folded.has(fold(k))) folded.set(fold(k), k)
  for (const kind of ['v', 'a'])
    for (const [l, forms] of Object.entries(forme[kind]))
      for (const f of forms.split(' ')) if (!lemma.has(f)) lemma.set(f, l)
  size = index.length
}

export const has = k => byKey.has(k)
export const isVerb = k => verbs.has(k)
export const ids = k => (byKey.get(k) ?? []).map(x => x.id)

const CLITIC = /(?:(?:glie|me|te|ce|ve|se)(?:lo|la|li|le|ne)|mi|ti|si|ci|vi|lo|la|li|le|ne|gli)$/
const REFLEXIVE = /(?:mi|ti|si|ci|vi)$/

// verbo riflessivo: lavare -> lavarsi, porre -> porsi
export const reflexive = v => v.replace(/r?re$/, 'r') + 'si'

// Le parole chiave a cui puo' riferirsi una parola, dalla piu' probabile
export function lemmas(k) {
  const out = []
  const push = w => { if (w && has(w) && !out.includes(w)) out.push(w) }
  push(k)
  push(lemma.get(k))
  if (out.length) return out
  // l'amico, dell'acqua, c'e'
  const el = k.match(/^\p{L}+'(.+)$/u)
  if (el) return lemmas(el[1])
  // mangiarlo, lavandosi, parlami
  const cl = k.length > 4 && k.match(CLITIC)
  if (cl) {
    const base = k.slice(0, -cl[0].length)
    const inf = /[aei]r$/.test(base) ? base + 'e' : lemma.get(base)
    if (inf && REFLEXIVE.test(cl[0])) push(reflexive(inf))
    push(inf)
  }
  // scritto senza accenti: perche -> perché
  if (!out.length) push(folded.get(fold(k)))
  return out
}

export const lemmaOf = k => lemma.get(k) ?? (has(k) ? k : null)

// Simboli candidati per una parola o un gruppo di parole
export function candidates(keys) {
  const out = []
  for (const k of keys) for (const id of ids(k)) if (!out.includes(id)) out.push(id)
  return out
}

// Ricerca libera: prima le parole che iniziano con q, poi quelle che la contengono
export function search(q, max = 48) {
  q = norm(q)
  if (q.length < 2) return []
  const seen = new Set(), out = []
  for (const pass of [w => w.n.startsWith(q), w => !w.n.startsWith(q) && w.n.includes(q)])
    for (const w of words) {
      if (out.length >= max) return out
      if (pass(w) && !seen.has(w.id)) { seen.add(w.id); out.push(w) }
    }
  return out
}
