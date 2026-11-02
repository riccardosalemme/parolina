// Testo semplice: il documento senza markdown, una riga per riga del documento.
//
// Chi scrive vede solo le parole; titoli, grassetto, corsivo e simboli scelti restano nascosti.
// merge() rimette le modifiche nel documento: le parole rimaste uguali (confronto parola per parola,
// LCS) tengono il loro simbolo e il loro stile, quelle nuove prendono il simbolo automatico.

const words = s => s.split(/\s+/).filter(Boolean)

export const toPlain = lines => lines.map(l => l.tokens.map(t => t.w).join(' ')).join('\n')

// Sequenza di parole e fine riga: { w, tok, part, n, li } | { nl: true, li }
function flatten(lines) {
  const out = []
  lines.forEach((l, li) => {
    for (const tok of l.tokens) {
      const parts = words(tok.w)
      parts.forEach((w, part) => out.push({ w, tok, part, n: parts.length, li }))
    }
    out.push({ nl: true, li })
  })
  return out
}

const same = (a, b) => (a.nl ? b.nl : !b.nl && a.w === b.w)

// match[j] = elemento di a corrispondente a b[j], oppure null
function align(a, b) {
  const match = new Array(b.length).fill(null)
  let s = 0, ea = a.length, eb = b.length
  while (s < ea && s < eb && same(a[s], b[s])) { match[s] = a[s]; s++ }
  while (ea > s && eb > s && same(a[ea - 1], b[eb - 1])) { match[--eb] = a[--ea] }
  // sottosequenza comune piu' lunga solo sulla parte cambiata (di solito poche parole)
  const n = ea - s, m = eb - s, w = m + 1
  const dp = new Int32Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i * w + j] = same(a[s + i], b[s + j]) ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1])
  for (let i = 0, j = 0; i < n && j < m;) {
    if (same(a[s + i], b[s + j])) { match[s + j] = a[s + i]; i++; j++ }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++
    else j++
  }
  return match
}

const style = (t, from) => { if (from?.b) t.b = true; if (from?.i) t.i = true; return t }

// la riga e' un titolo / elenco se lo era la riga da cui viene la sua prima parola rimasta uguale
function buildLine(lines, items) {
  const first = items.find(x => x.o)
  const kind = !items.length ? 'blank' : first ? lines[first.o.li].kind : 'p'

  const tokens = []
  for (let k = 0; k < items.length; k++) {
    const { w, o } = items[k]
    if (o && o.part === 0 && items.slice(k, k + o.n).every((x, d) => x.o?.tok === o.tok && x.o.part === d)) {
      tokens.push({ ...o.tok })          // riquadro intero rimasto uguale: tiene il suo simbolo
      k += o.n - 1
    } else if (o) {
      tokens.push(style({ w }, o.tok))   // parte di un riquadro cambiato: tiene solo lo stile
    } else {
      // parola nuova: grassetto/corsivo se lo sono le parole vicine
      const prev = items.slice(0, k).reverse().find(x => x.o)?.o.tok
      const next = items.slice(k + 1).find(x => x.o)?.o.tok
      const both = p => (prev ?? next)?.[p] && (next ?? prev)?.[p]
      tokens.push(style({ w }, { b: both('b'), i: both('i') }))
    }
  }
  return { kind, tokens }
}

export function merge(lines, text) {
  const a = flatten(lines)
  const b = []
  for (const line of text.split('\n')) {
    for (const w of words(line)) b.push({ w })
    b.push({ nl: true })
  }
  const match = align(a, b)
  const out = []
  let items = []
  b.forEach((x, j) => {
    if (!x.nl) return items.push({ w: x.w, o: match[j] })
    out.push(buildLine(lines, items))
    items = []
  })
  return out
}

// Riga e riquadri (indici dei token) coperti dalla selezione [s, e) del testo semplice
export function selection(lines, text, s, e) {
  const before = text.slice(0, s).split('\n')
  const li = before.length - 1
  const start = s - before.at(-1).length
  const line = text.slice(start).split('\n')[0]
  const spans = [...line.matchAll(/\S+/g)].map(m => [start + m.index, start + m.index + m[0].length])
  const hit = spans.map((sp, n) => (e > s ? sp[0] < e && sp[1] > s : sp[0] <= s && s <= sp[1]) ? n : -1).filter(n => n >= 0)
  if (!hit.length || !lines[li]) return { li, card: null }
  // parola n -> token che la contiene
  const owner = lines[li].tokens.flatMap((t, ti) => words(t.w).map(() => ti))
  return { li, card: { start: owner[hit[0]], end: owner[hit.at(-1)] + 1 } }
}
