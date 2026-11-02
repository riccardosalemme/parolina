// Test veloci della logica (senza browser):  npm test
// Usano il vocabolario vero in public/data (crealo con gli script se manca).

import assert from 'node:assert/strict'
import fs from 'node:fs'

globalThis.fetch = async f => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(new URL(f), 'utf8')) })

const lex = await import('../src/lib/lexicon.js')
const { chunk } = await import('../src/lib/chunk.js')
const { parse, serialize } = await import('../src/lib/md.js')
const { toPlain, merge } = await import('../src/lib/plain.js')
await lex.load(new URL('../public/', import.meta.url).href)

const cards = s => chunk(parse(s)[0].tokens).map(c => [c.tokens.map(t => t.w).join(' '), c.keys[0]])
const test = (name, fn) => { fn(); console.log('ok -', name) }

test('verbi coniugati e tempi composti', () => {
  assert.deepEqual(cards('vado'), [['vado', 'andare']])
  assert.deepEqual(cards('ho mangiato'), [['ho mangiato', 'mangiare']])
  assert.deepEqual(cards('sto leggendo'), [['sto leggendo', 'leggere']])
  assert.deepEqual(cards('sono stanco'), [['sono', 'essere'], ['stanco', 'stanco']])
})

test('riflessivi, pronomi attaccati, apostrofi, accenti', () => {
  assert.deepEqual(cards('mi lavo'), [['mi lavo', 'lavarsi']])
  assert.deepEqual(cards('mangiarlo'), [['mangiarlo', 'mangiare']])
  assert.deepEqual(cards("l'acqua"), [["l'acqua", 'acqua']])
  assert.deepEqual(cards('perche'), [['perche', 'perché']])
})

test('articoli ed espressioni', () => {
  assert.deepEqual(cards('la casa'), [['la casa', 'casa']])
  assert.deepEqual(cards('olio di oliva'), [['olio di oliva', 'olio di oliva']])
})

test('link ai simboli', () => {
  const [c] = chunk(parse('[maestra di piano](symbol:maestra)')[0].tokens)
  assert.equal(c.keys[0], 'maestra')
  assert.ok(c.id)
  assert.equal(chunk(parse('[nonna](symbol:img-abc)')[0].tokens)[0].id, 'img-abc')
  assert.equal(chunk(parse('[la](symbol:0)')[0].tokens)[0].id, null)
})

test('markdown: andata e ritorno', () => {
  const md = '# Titolo **forte**\nla [maestra di piano](symbol:2457) _legge_\n\n- pane'
  assert.equal(serialize(parse(md)), md)
  assert.equal(serialize(parse('(la nonna)[symbol:12]')), '[la nonna](symbol:12)')
})

test('testo semplice: le modifiche tengono simboli e stile', () => {
  const lines = parse('# La mia **giornata**\nla [maestra di piano](symbol:2457) mi spiega')
  const out = serialize(merge(lines, toPlain(lines).replace('spiega', 'insegna')))
  assert.equal(out, '# La mia **giornata**\nla [maestra di piano](symbol:2457) mi insegna')
})
