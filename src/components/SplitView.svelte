<script>
  import { tick } from 'svelte'
  import Preview from './Preview.svelte'
  import { serialize } from '../lib/md.js'
  import { toPlain, merge, selection, styled, unmark } from '../lib/plain.js'
  import * as ed from '../lib/edit.js'
  import { doc, settings, ui } from '../lib/state.svelte.js'

  let { lines, view, onchange } = $props()
  let area, mirror
  let tab = $state('text')   // su telefono si vede un pannello alla volta
  // la selezione si fa sui simboli; tornare al testo la spegne
  $effect(() => { if (ui.select) tab = 'symbols' })
  const toText = () => { tab = 'text'; ui.select = null }

  // Testo semplice: il campo mostra solo le parole, il markdown resta nascosto nel documento.
  // `text` cambia solo quando il documento cambia da fuori (scelta di un simbolo, apri un testo...).
  let text = $state(toPlain(lines))
  let mine = doc.md
  $effect(() => {
    if (doc.md !== mine) { mine = doc.md; text = toPlain(lines) }
  })

  function typed(e) {
    mine = serialize(merge(lines, text))
    doc.md = mine
    if (!e?.isComposing) unmarkField()
  }

  // "- " o "# " a inizio riga: la riga e' gia' elenco / titolo, il segno sparisce anche dal campo
  // (non mentre la tastiera del telefono sta ancora componendo la parola)
  function unmarkField() {
    const u = unmark(text, area.selectionStart)
    if (u.text === text) return
    text = u.text
    tick().then(() => area.setSelectionRange(u.at, u.at))
  }

  // dietro al campo (con le lettere trasparenti) la stessa scritta con titoli, grassetto e corsivo
  const shown = $derived(styled(lines, text))

  function formatPlain(what) {
    const { li, card } = selection(lines, text, area.selectionStart, area.selectionEnd)
    if (what === 'h' || what === 'li') onchange(ed.setKind(lines, li, ed.nextKind(lines[li].kind, what)))
    else if (card) onchange(ed.toggle(lines, li, card, what))
    area.focus()
  }

  const BLOCK = /^(#{1,3}\s+|[-*+]\s+)/
  const NEXT_HEADING = { '': '# ', '# ': '## ', '## ': '### ', '### ': '' }

  async function replace(from, to, text, selFrom, selTo) {
    doc.md = doc.md.slice(0, from) + text + doc.md.slice(to)
    await tick()
    area.focus()
    area.setSelectionRange(selFrom, selTo)
  }

  // **grassetto** / _corsivo_ attorno alla selezione (o alla parola sotto il cursore)
  function wrap(mark) {
    const v = doc.md
    let s = area.selectionStart, e = area.selectionEnd
    if (s === e) {
      while (s > 0 && /\S/.test(v[s - 1])) s--
      while (e < v.length && /\S/.test(v[e])) e++
    }
    if (s === e) return
    const sel = v.slice(s, e)
    const on = sel.length > 2 * mark.length && sel.startsWith(mark) && sel.endsWith(mark)
    const out = on ? sel.slice(mark.length, -mark.length) : mark + sel + mark
    replace(s, e, out, s, s + out.length)
  }

  // titolo (# -> ## -> ### -> testo) o elenco sulla riga del cursore
  function block(what) {
    const v = doc.md
    const s = v.lastIndexOf('\n', area.selectionStart - 1) + 1
    const e = (v.indexOf('\n', s) + 1 || v.length + 1) - 1
    const line = v.slice(s, e)
    const prefix = line.match(BLOCK)?.[0] ?? ''
    const kind = prefix.startsWith('#') ? prefix.trim() + ' ' : prefix ? '- ' : ''
    const next = what === 'li' ? (kind === '- ' ? '' : '- ') : NEXT_HEADING[kind] ?? '# '
    const out = next + line.slice(prefix.length)
    replace(s, e, out, s + out.length, s + out.length)
  }

  // Ctrl+B / Ctrl+I come in un editor di testo
  function onkeydown(e) {
    const what = (e.ctrlKey || e.metaKey) && { b: 'b', i: 'i' }[e.key.toLowerCase()]
    if (what) { e.preventDefault(); format(what) }
  }

  export function format(what) {
    // simbolo toccato (e il cursore non e' nel testo): la modifica va al simbolo, senza cambiare pannello
    if (ui.pick && document.activeElement !== area) return onchange(ed.formatCards(lines, ed.cardsAt(view, [ui.pick]), what))
    tab = 'text'
    if (!settings.markdown) formatPlain(what)
    else if (what === 'b') wrap('**')
    else if (what === 'i') wrap('_')
    else block(what)
  }
</script>

<div class="split">
  <div class="tabs no-print" role="tablist">
    <button role="tab" aria-selected={tab === 'text'} onclick={toText}>Testo</button>
    <button role="tab" aria-selected={tab === 'symbols'} onclick={() => (tab = 'symbols')}>Simboli</button>
  </div>
  <section class="pane editor no-print" class:show={tab === 'text'}>
    {#if settings.markdown}
      <textarea bind:this={area} bind:value={doc.md} {onkeydown} spellcheck="true" lang="it"
        placeholder="Scrivi qui il tuo testo in markdown…" aria-label="Testo in markdown" class="md"></textarea>
    {:else}
      <div class="plain">
        <div class="mirror" bind:this={mirror} aria-hidden="true">
          {#each shown as l}
            <div class="ml {l.kind}">{#each l.parts as p}{#if p.b || p.i}<span class:b={p.b} class:i={p.i}>{p.s}</span>{:else}{p.s}{/if}{/each}{#if !l.parts.length}{'\u200b'}{/if}</div>
          {/each}
        </div>
        <textarea bind:this={area} bind:value={text} oninput={typed} oncompositionend={unmarkField} {onkeydown} onscroll={() => (mirror.scrollTop = area.scrollTop)}
          spellcheck="true" lang="it" placeholder="Scrivi qui il tuo testo…" aria-label="Testo"></textarea>
      </div>
    {/if}
    <div class="hint">
      {#if settings.markdown}
        <p><code># Titolo</code> <code>**grassetto**</code> <code>_corsivo_</code> <code>- elenco</code> <code>[più parole](symbol:maestra)</code></p>
      {:else}
        <p>Titoli, grassetto ed elenchi: usa i tasti in alto. Per cambiare un simbolo toccalo.</p>
      {/if}
      <label class="switch" title="Mostra il testo con i segni del formato markdown (per utenti esperti)">
        <input type="checkbox" role="switch" bind:checked={settings.markdown} />
        <span>Markdown</span>
      </label>
    </div>
  </section>
  <section class="pane preview" class:show={tab === 'symbols'}>
    <Preview {view} />
  </section>
</div>

<style>
  .split {
    display: grid; grid-template-columns: minmax(280px, 2fr) 3fr;
    height: 100%; min-height: 0;
  }
  .pane { min-height: 0; overflow: auto; }
  .editor {
    display: flex; flex-direction: column;
    border-right: 1px solid var(--line); background: var(--surface);
  }
  textarea {
    flex: 1; width: 100%; resize: none; border: 0; outline: none;
    padding: 24px 28px; background: transparent;
    font-size: 21px; line-height: 1.6;
  }
  /* testo semplice: il campo e la scritta dietro devono andare a capo negli stessi punti */
  .plain { position: relative; flex: 1; min-height: 0; display: flex; }
  .mirror, .plain textarea { scrollbar-gutter: stable; white-space: pre-wrap; overflow-wrap: break-word; }
  .mirror {
    position: absolute; inset: 0; overflow: hidden; pointer-events: none;
    padding: 24px 28px; font-size: 21px; line-height: 1.6; color: var(--ink);
  }
  .plain textarea { position: relative; color: transparent; caret-color: var(--ink); }
  .plain textarea::placeholder { color: var(--muted); }
  .plain textarea::selection { color: transparent; background: color-mix(in srgb, var(--accent) 30%, transparent); }
  /* solo stili che non cambiano la larghezza delle lettere */
  .mirror .b { -webkit-text-stroke: .045em currentColor; }
  .mirror .i { display: inline-block; transform: skewX(-12deg); }
  .ml { position: relative; border-radius: 4px; }
  .ml.h1, .ml.h2, .ml.h3 { -webkit-text-stroke: .045em currentColor; background: var(--accent-soft); box-shadow: 0 0 0 4px var(--accent-soft); }
  .ml.h1 { color: var(--accent); }
  .ml.h3 { background: var(--soft); box-shadow: 0 0 0 4px var(--soft); }
  .ml.h1::before, .ml.h2::before, .ml.h3::before {
    content: ''; position: absolute; left: -12px; top: 4px; bottom: 4px; width: 4px; border-radius: 2px; background: var(--accent);
  }
  .ml.li::before { content: '•'; position: absolute; left: -.6em; color: var(--accent); -webkit-text-stroke: 0; }
  textarea.md { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 17px; }
  .hint {
    display: flex; align-items: center; gap: 12px; padding: 8px 12px 8px 20px;
    color: var(--muted); font-size: 13px; border-top: 1px solid var(--line);
  }
  .hint p { flex: 1; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .switch { display: flex; align-items: center; gap: 8px; min-height: 40px; font-weight: 700; color: var(--ink); cursor: pointer; flex: none; }
  .switch input {
    appearance: none; width: 40px; height: 24px; margin: 0; border-radius: 12px; background: var(--line);
    position: relative; cursor: pointer; transition: background .15s;
  }
  .switch input::after {
    content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%;
    background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / .25); transition: transform .15s;
  }
  .switch input:checked { background: var(--accent); }
  .switch input:checked::after { transform: translateX(16px); }
  code { background: var(--soft); padding: 2px 6px; border-radius: 6px; font-size: 12.5px; }
  .preview { padding: 28px; }
  .tabs { display: none; }

  @media (max-width: 760px) {
    .split { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .tabs {
      display: flex; gap: 4px; padding: 8px 12px 0; background: var(--bg);
    }
    .tabs button {
      flex: 1; min-height: 42px; border: 0; border-radius: 10px 10px 0 0;
      background: transparent; color: var(--muted); font-weight: 700;
    }
    .tabs button[aria-selected='true'] { background: var(--surface); color: var(--ink); }
    .pane { display: none; }
    .pane.show { display: flex; }
    .preview.show { display: block; padding: 16px; }
    .editor { border-right: 0; }
    textarea, .mirror { padding: 18px 16px; font-size: 19px; }
  }

  @media print {
    .split { display: block; height: auto; }
    .preview { display: block !important; padding: 0; overflow: visible; }
  }
</style>
