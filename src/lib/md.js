// Markdown di Parolina <-> documento
//
// Una riga = un blocco:  "# titolo", "## sottotitolo", "### ...", "- elenco", riga vuota, testo.
// Nel testo: **grassetto**, _corsivo_ (o *corsivo*), e i link ai simboli:
//   [maestra di piano](symbol:2457)     -> piu' parole, un solo simbolo (id ARASAAC)
//   [maestra di piano](symbol:maestra)  -> il simbolo della parola "maestra" (comodo per gli LLM)
//   [nonna](symbol:img-1k3x9f2a)        -> un'immagine personale
//   [la](symbol:0)                      -> nessun simbolo
// E' accettata anche la forma (maestra di piano)[symbol:2457].
//
// Documento: [{ kind: 'p'|'h1'|'h2'|'h3'|'li'|'blank', tokens: [{ w, id?, b?, i? }] }]

const BLOCK = /^(#{1,3})\s+|^[-*+]\s+/
const INLINE = /\[([^\]]+)\]\(symbol:([^)]+)\)|\(([^)]+)\)\[symbol:([^\]]+)\]|(\*\*|__)|(\*|_)|([^\s*_]+)/g
const DEFINITION = /^\[[^\]]+\]:\s/   // [img-...]: data:... (immagini in fondo al file)

export function parse(md) {
  return md.replace(/\r/g, '').split('\n').filter(l => !DEFINITION.test(l)).map(parseLine)
}

// id di un'immagine personale (vedi images.svelte.js)
export const isImage = id => typeof id === 'string' && id.startsWith('img-')

const symbolId = v => (v = v.trim(), /^\d+$/.test(v) ? +v : v)

function parseLine(line) {
  const m = line.match(BLOCK)
  const kind = m ? (m[1] ? 'h' + m[1].length : 'li') : line.trim() ? 'p' : 'blank'
  return { kind, tokens: parseInline(m ? line.slice(m[0].length) : line) }
}

function parseInline(text) {
  const tokens = []
  let b = false, i = false
  for (const m of text.matchAll(INLINE)) {
    if (m[5]) b = !b
    else if (m[6]) i = !i
    else {
      const t = m[7] ? { w: m[7] } : { w: (m[1] ?? m[3]).trim(), id: symbolId(m[2] ?? m[4]) }
      if (b) t.b = true
      if (i) t.i = true
      tokens.push(t)
    }
  }
  return tokens
}

const PREFIX = { p: '', blank: '', h1: '# ', h2: '## ', h3: '### ', li: '- ' }

export function serialize(lines) {
  return lines.map(l => PREFIX[l.kind] + serializeInline(l.tokens)).join('\n')
}

function serializeInline(tokens) {
  let out = '', b = false, i = false
  tokens.forEach((t, n) => {
    const word = t.id != null ? `[${t.w}](symbol:${t.id})` : t.w
    const open = (!!t.i && !i ? '_' : '') + (!!t.b && !b ? '**' : '')
    const close = (!t.b && b ? '**' : '') + (!t.i && i ? '_' : '')
    out += close + (n ? ' ' : '') + open + word
    b = !!t.b; i = !!t.i
  })
  return out + (b ? '**' : '') + (i ? '_' : '')
}

// Titolo del documento: la prima riga scritta
export function title(lines) {
  const l = lines.find(l => l.tokens.length)
  return l ? l.tokens.map(t => t.w).join(' ').slice(0, 60) : 'Senza titolo'
}

// Solo il testo, senza markdown
export const plain = lines => lines.map(l => (l.kind === 'li' ? '• ' : '') + l.tokens.map(t => t.w).join(' ')).join('\n')
