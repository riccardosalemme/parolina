<script>
  import { tick, onMount } from 'svelte'
  import Card from './Card.svelte'
  import Symbol from './Symbol.svelte'
  import { chunk } from '../lib/chunk.js'
  import * as lex from '../lib/lexicon.js'
  import * as ed from '../lib/edit.js'
  import { settings, ui, sheetStyle } from '../lib/state.svelte.js'

  let { lines, view, onchange } = $props()

  // Il cursore e' una casella di scrittura tra due parole: riga + quante parole ha dopo di se'.
  // Contare le parole "dopo" fa si' che scrivere o cambiare simboli prima del cursore non lo sposti.
  let caret = $state({ line: Infinity, tail: 0 })
  let text = $state('')
  let input = $state()
  let pulled = null   // parole tolte dal testo per modificarle: se restano uguali tornano come erano

  const li = $derived(Math.min(caret.line, lines.length - 1))
  const pos = $derived(Math.max(0, lines[li].tokens.length - caret.tail))
  const opt = $derived({ articles: settings.articles, verbs: settings.verbs })
  const live = $derived(text.trim() ? lex.candidates(lex.lemmas(lex.norm(text.trim())))[0] ?? null : null)

  const shift = (cards, n) => cards.map(c => ({ ...c, start: c.start + n, core: c.core + n, end: c.end + n }))
  const rows = $derived(view.map((l, n) => n !== li ? { ...l, before: l.cards, after: [] } : {
    ...l,
    before: chunk(l.tokens.slice(0, pos), opt),
    after: shift(chunk(l.tokens.slice(pos), opt), pos),
  }))

  const selected = (n, c) => ui.pick?.line === n && c.start <= ui.pick.at && ui.pick.at < c.end
  const focus = async (at) => {
    await tick()
    if (!input || ui.dialog) return
    input.focus()
    if (at != null) input.setSelectionRange(at, at)
  }
  const place = (line, tail) => { caret = { line, tail }; focus() }
  const tokensOf = n => lines[n].tokens

  onMount(focus)

  // la parola nella casella entra nel testo; restituisce quante parole ha aggiunto
  function commit() {
    const t = text.trim()
    const toks = pulled && t === pulled.map(x => x.w).join(' ') ? pulled : ed.words(t)
    text = ''
    pulled = null
    if (toks.length) onchange(ed.insert(lines, li, pos, toks))
    return toks.length
  }

  // posizioni calcolate prima di commit(): le parole dopo il cursore si spostano
  const after = (n, at, added) => (n === li && at >= pos - added ? at + added : at)

  function edit(n, c) {
    const added = commit()
    const start = after(n, c.start, added), end = after(n, c.end, added)
    pulled = tokensOf(n).slice(start, end)
    text = pulled.map(x => x.w).join(' ')
    onchange(ed.remove(lines, n, start, end - start))
    place(n, tokensOf(n).length - start)
  }

  function pick(n, c) {
    const added = commit()
    ui.pick = { line: n, at: after(n, c.core, added) }
    caret = { line: n, tail: 0 }
  }

  function oninput() {
    if (!/\s/.test(text)) return
    const parts = text.split(/\s+/)
    const rest = parts.pop()
    text = parts.join(' ')
    commit()
    text = rest
  }

  function onkeydown(e) {
    const s = input.selectionStart, atStart = s === 0 && input.selectionEnd === 0, atEnd = s === text.length
    const toks = tokensOf(li)
    const key = e.key
    if (key === 'Enter') {
      commit()
      onchange(ed.breakLine(lines, li, pos))
      place(li + 1, caret.tail)
    } else if (key === 'Backspace' && atStart && pos > 0) {
      // cancello lo spazio prima: la parola precedente torna nella casella
      const prev = toks[pos - 1]
      pulled = text ? null : [prev]
      text = prev.w + text
      onchange(ed.remove(lines, li, pos - 1))
      focus(prev.w.length)
    } else if (key === 'Backspace' && atStart && li > 0) {
      onchange(ed.joinLines(lines, li))
      place(li - 1, caret.tail)
    } else if (key === 'Delete' && atEnd && caret.tail > 0) {
      const next = toks[pos]
      text += next.w
      onchange(ed.remove(lines, li, pos))
      caret.tail--
      focus(s)
    } else if (key === 'ArrowLeft' && atStart) {
      commit()
      if (caret.tail < tokensOf(li).length) place(li, caret.tail + 1)
      else if (li > 0) place(li - 1, 0)
    } else if (key === 'ArrowRight' && atEnd) {
      commit()
      if (caret.tail > 0) place(li, caret.tail - 1)
      else if (li < lines.length - 1) place(li + 1, tokensOf(li + 1).length)
    } else if ((key === 'ArrowUp' && li > 0) || (key === 'ArrowDown' && li < lines.length - 1)) {
      commit()
      const n = li + (key === 'ArrowUp' ? -1 : 1)
      place(n, Math.max(0, tokensOf(n).length - pos))
    } else return
    e.preventDefault()
  }

  // tocco su uno spazio vuoto: scrivo in fondo a quella riga (o al testo)
  function toEnd(e, n = lines.length - 1) {
    if (e.target !== e.currentTarget) return
    commit()
    place(Math.min(n, lines.length - 1), 0)
  }

  // grassetto e corsivo sulla parola prima del cursore (o su quella selezionata), titolo ed elenco sulla riga
  export function format(what) {
    commit()
    if (what === 'h' || what === 'li') {
      onchange(ed.setKind(lines, li, ed.nextKind(lines[li].kind, what)))
    } else {
      const n = ui.pick?.line ?? li
      const c = ui.pick ? view[n].cards.find(c => selected(n, c)) : rows[li].before.at(-1)
      if (c) onchange(ed.toggle(lines, n, c, what))
    }
    focus()
  }
</script>

<!-- mousedown senza effetto: toccare i simboli non toglie la tastiera dalla casella di scrittura -->
<div class="sheet writer" style={sheetStyle()} onmousedown={e => e.target.tagName !== 'INPUT' && e.preventDefault()}
  onclick={e => toEnd(e)} role="presentation">
  {#each rows as l, n}
    <div class="row {n === li && l.kind === 'blank' ? 'p' : l.kind}" onclick={e => toEnd(e, n)} role="presentation">
      {#if l.kind === 'li'}<span class="bullet">•</span>{/if}
      {#each l.before as c (c.start)}
        <Card card={c} selected={selected(n, c)} onpick={() => pick(n, c)} onedit={() => edit(n, c)} />
      {/each}
      {#if n === li}
        <div class="card live">
          <div class="pic" class:empty={!live}>{#if live}<Symbol id={live} />{/if}</div>
          <input class="lbl" bind:this={input} bind:value={text} size={text ? text.length + 1 : 8} placeholder="scrivi…"
            {oninput} {onkeydown} onblur={commit} aria-label="Scrivi una parola"
            autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="enter" />
        </div>
      {/if}
      {#each l.after as c (c.start)}
        <Card card={c} selected={selected(n, c)} onpick={() => pick(n, c)} onedit={() => edit(n, c)} />
      {/each}
    </div>
  {/each}
</div>

<style>
  .writer { cursor: text; padding-bottom: calc(var(--sym) * 1.2); }
  .row { min-height: calc(var(--sym) * var(--k) + var(--txt) * 1.6); }
  .row.blank { min-height: 0; }
  .live {
    border-style: dashed; border-color: #b9b3a6;
    border-width: max(var(--fw), 2px);
    background: #fffbea;
  }
  .live .pic img { opacity: .55; }
  .live .pic.empty { border-color: transparent; }
  .live input::placeholder { color: #a59c8f; opacity: 1; }
  .live input {
    min-width: 2ch; max-width: 100%;
    border: 0; outline: none; background: transparent;
    border-bottom: 3px solid var(--sun);
    font-weight: 400;
  }
  @media print { .live { display: none; } }
</style>
