// Annulla / ripeti sul testo aperto.
// Le lettere scritte di fila (pause sotto 0,8 s) contano come un passo solo;
// ogni azione sui simboli (scegli, unisci, separa, una parola scritta sui simboli) e' un passo a se'.

import { doc } from './state.svelte.js'

const past = [], future = []
let prev = doc.md, prevId = doc.id, last = 0, restoring = false, alone = false

export const steps = $state({ undo: 0, redo: 0 })

// la prossima modifica e' un passo a se'
export const checkpoint = () => { alone = true }
const sync = () => { steps.undo = past.length; steps.redo = future.length }

// da chiamare in un $effect che legge doc.md e doc.id
export function record() {
  if (doc.id !== prevId) {
    past.length = future.length = 0
  } else if (doc.md !== prev && !restoring) {
    if (alone || Date.now() - last > 800 || !past.length) past.push(prev)
    if (past.length > 100) past.shift()
    future.length = 0
    last = alone ? 0 : Date.now()
    alone = false
  }
  restoring = false
  prev = doc.md
  prevId = doc.id
  sync()
}

function move(from, to) {
  if (!from.length) return
  to.push(doc.md)
  const md = from.pop()
  restoring = md !== doc.md
  doc.md = md
  last = 0
}

export const undo = () => move(past, future)
export const redo = () => move(future, past)
