<script>
  import { onMount, untrack } from 'svelte'
  import Icon from './components/Icon.svelte'
  import Logo from './components/Logo.svelte'
  import SplitView from './components/SplitView.svelte'
  import SymWriter from './components/SymWriter.svelte'
  import Picker from './components/Picker.svelte'
  import Modal from './components/Modal.svelte'
  import Settings from './components/Settings.svelte'
  import Files from './components/Files.svelte'
  import Qr from './components/Qr.svelte'
  import Menu from './components/Menu.svelte'
  import Install from './components/Install.svelte'
  import * as lex from './lib/lexicon.js'
  import { parse, serialize, title } from './lib/md.js'
  import { chunk } from './lib/chunk.js'
  import * as ed from './lib/edit.js'
  import { fromLink } from './lib/qr.js'
  import { ROOT } from './lib/symbols.js'
  import { copy } from './lib/files.js'
  import { FEEDBACK, feedbackUrl } from './lib/feedback.js'
  import { textPrompt } from './lib/prompts.js'
  import { install, askInstall } from './lib/install.svelte.js'
  import { absorb, hasDefinitions } from './lib/images.svelte.js'
  import { settings, saveSettings, doc, ui, saveDoc, newDoc, toast } from './lib/state.svelte.js'
  import { steps, record, checkpoint, undo, redo } from './lib/undo.svelte.js'

  let ready = $state(false), failed = $state(false)
  let editor = $state()

  const lines = $derived(parse(doc.md))
  const view = $derived(ready ? lines.map(l => ({ ...l, cards: chunk(l.tokens, { articles: settings.articles, verbs: settings.verbs }) })) : [])
  let kept = ''   // ultimo testo prodotto dalle modifiche dell'app
  const change = next => { checkpoint(); doc.md = kept = serialize(next) }
  // il testo e' cambiato da fuori (scrittura, annulla, altro testo): i riquadri scelti non valgono piu'
  $effect(() => { if (doc.md !== kept) untrack(() => { if (ui.select?.length) ui.select = [] }) })

  // modalita' selezione (telefono): tocco i simboli e li cambio insieme, senza tastiera ne' pannello
  function selectMode() {
    ui.pick = null
    ui.select = ui.select ? null : []
    if (ui.select) document.activeElement?.blur()
  }

  function format(what) {
    if (!ui.select) return editor?.format(what)
    if (!ui.select.length) return toast('Prima tocca i simboli da cambiare')
    change(ed.formatCards(lines, ed.cardsAt(view, ui.select), what))
  }

  $effect(() => { JSON.stringify(settings); saveSettings() })
  const auto = $derived(title(lines))
  $effect(() => { doc.md; doc.name; const t = setTimeout(saveDoc, 400); return () => clearTimeout(t) })
  $effect(() => { document.title = `${doc.name || auto} · Parolina` })
  $effect(() => { doc.md; doc.id; record() })
  // testo incollato con le immagini in fondo (file .md scaricato dall'app): le salvo
  $effect(() => { if (hasDefinitions(doc.md)) doc.md = absorb(doc.md) })

  // nome del testo: finche' non lo cambi e' la prima riga
  const editName = () => { if (!doc.name) doc.name = auto }
  const doneName = () => { if (doc.name.trim() === auto) doc.name = ''; doc.name = doc.name.trim() }

  async function copyText() {
    await copy(doc.md)
    toast('Testo copiato')
  }

  async function copyPrompt() {
    await copy(textPrompt())
    toast("Prompt copiato: completalo e incollalo nell'IA")
  }

  onMount(async () => {
    addEventListener('pagehide', saveDoc)
    // aperto da un QR code / link condiviso
    const shared = await fromLink(location.hash)?.catch(() => null)
    if (shared != null) {
      newDoc(shared)
      history.replaceState(null, '', location.pathname)
      toast('Testo aperto dal link')
    }
    try {
      await lex.load(ROOT)
      ready = true
    } catch {
      failed = true
    }
  })

  const ZOOM = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]
  const zoom = d => {
    const n = ZOOM.findIndex(z => z >= settings.zoom - 0.001)
    settings.zoom = ZOOM[Math.max(0, Math.min(ZOOM.length - 1, n + d))]
  }

  function print() {
    ui.pick = null
    setTimeout(() => window.print(), 50)
  }

  // Ctrl+Z / Ctrl+Y (nei campi di testo vale l'annulla del browser), Esc chiude il pannello del simbolo
  function onkeydown(e) {
    if (ui.dialog) return
    if (e.key === 'Escape' && ui.select) return (ui.select = null)
    if (e.key === 'Escape' && ui.pick) return (ui.pick = null)
    const k = (e.ctrlKey || e.metaKey) && e.key.toLowerCase()
    const t = e.target
    if ((k !== 'z' && k !== 'y') || t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.value)) return
    e.preventDefault()
    k === 'y' || e.shiftKey ? redo() : undo()
  }

  const ACTIONS = $derived([
    { icon: 'plus', label: 'Nuovo', long: 'Nuovo testo', run: () => { newDoc(); ui.pick = null } },
    { icon: 'folder', label: 'I miei testi', run: () => (ui.dialog = 'files') },
    { icon: 'qr', label: 'QR', long: 'QR code', run: () => (ui.dialog = 'qr') },
    { icon: 'copy', label: 'Copia', long: 'Copia il testo', run: copyText },
    { icon: 'print', label: 'Stampa', long: 'Stampa o salva PDF', run: print },
    { icon: 'sliders', label: 'Impostazioni', run: () => (ui.dialog = 'settings') },
    FEEDBACK && { icon: 'message', label: 'Segnala', long: 'Segnala o dai un parere', href: feedbackUrl('app') },
  ].filter(Boolean))
  // su schermi piccoli: un menu con le scritte (piu' chiaro delle sole icone)
  const MENU = $derived([
    ...ACTIONS.slice(0, 5),
    { icon: 'sparkle', label: "Prompt per l'IA", run: copyPrompt },
    ...ACTIONS.slice(5),
    !install.done && { icon: 'download', label: "Installa l'app", run: async () => { if (!await askInstall()) ui.dialog = 'install' } },
  ].filter(Boolean).map(a => ({ ...a, label: a.long ?? a.label })))

  const MODES = [
    { id: 'split', icon: 'columns', label: 'Testo e simboli' },
    { id: 'write', icon: 'pencil', label: 'Scrivi sui simboli' },
  ]
  const FORMAT = [
    { id: 'h', icon: 'heading', label: 'Titolo' },
    { id: 'b', icon: 'bold', label: 'Grassetto' },
    { id: 'i', icon: 'italic', label: 'Corsivo' },
    { id: 'li', icon: 'list', label: 'Elenco' },
  ]
</script>

<div class="app">
  <header class="top no-print">
    <div class="brand">
      <a class="logo" href="../" title="Parolina: torna alla pagina iniziale"><Logo size={40} /></a>
      <div class="names">
        <small>Parolina</small>
        <label class="namebox" title="Cambia il nome del testo">
          <input class="name" bind:value={doc.name} placeholder={auto} aria-label="Nome del testo" size={Math.max(4, (doc.name || auto).length + 1)}
            onfocus={editName} onblur={doneName} onkeydown={e => e.key === 'Enter' && e.currentTarget.blur()} />
          <Icon name="pencil" size={16} />
        </label>
      </div>
    </div>
    <nav>
      {#each ACTIONS as a}
        {#if a.href}
          <a class="btn ghost" href={a.href} target="_blank" rel="noopener" title={a.long ?? a.label}><Icon name={a.icon} /><span>{a.label}</span></a>
        {:else}
          <button class="btn ghost" onclick={a.run} title={a.long ?? a.label}><Icon name={a.icon} /><span>{a.label}</span></button>
        {/if}
      {/each}
    </nav>
    <div class="narrow"><Menu items={MENU} /></div>
  </header>

  <div class="tools no-print">
    <div class="modes" role="radiogroup" aria-label="Modo di scrittura">
      {#each MODES as m}
        <button role="radio" aria-checked={settings.mode === m.id} onclick={() => (settings.mode = m.id)} title={m.label}>
          <Icon name={m.icon} size={20} /><span>{m.label}</span>
        </button>
      {/each}
    </div>
    <button class="btn icon ghost sel" aria-pressed={!!ui.select} onclick={selectMode} title="Scegli più simboli" aria-label="Scegli più simboli">
      <Icon name="select" size={20} />
    </button>
    <div class="group">
      {#each FORMAT as f}
        <button class="btn icon ghost" class:li={f.id === 'li'} onmousedown={e => e.preventDefault()} onclick={() => format(f.id)} title={f.label} aria-label={f.label}>
          <Icon name={f.icon} size={20} />
        </button>
      {/each}
    </div>
    <button class="btn ghost ai" onclick={copyPrompt} title="Copia un prompt per far scrivere il testo a un'intelligenza artificiale">
      <Icon name="sparkle" size={20} /><span>Prompt per l'IA</span>
    </button>
    <div class="group">
      <button class="btn icon ghost" onmousedown={e => e.preventDefault()} onclick={undo} disabled={!steps.undo} title="Annulla (Ctrl+Z)" aria-label="Annulla"><Icon name="undo" size={20} /></button>
      <button class="btn icon ghost redo" onmousedown={e => e.preventDefault()} onclick={redo} disabled={!steps.redo} title="Ripeti (Ctrl+Y)" aria-label="Ripeti"><Icon name="redo" size={20} /></button>
    </div>
    <div class="group zoom">
      <button class="btn icon ghost" onclick={() => zoom(-1)} aria-label="Rimpicciolisci" disabled={settings.zoom <= ZOOM[0]}><Icon name="minus" size={20} /></button>
      <button class="pct" onclick={() => (settings.zoom = 1)} title="Torna al 100%">{Math.round(settings.zoom * 100)}%</button>
      <button class="btn icon ghost" onclick={() => zoom(1)} aria-label="Ingrandisci" disabled={settings.zoom >= ZOOM.at(-1)}><Icon name="plus" size={20} /></button>
    </div>
  </div>

  {#if ui.select}
    <div class="selbar no-print" role="status">
      <span>{ui.select.length ? `${ui.select.length} ${ui.select.length === 1 ? 'simbolo scelto' : 'simboli scelti'}` : 'Tocca i simboli da cambiare'}</span>
      {#if ui.select.length}<button class="btn ghost" onclick={() => (ui.select = [])}>Togli tutti</button>{/if}
      <button class="btn primary" onclick={() => (ui.select = null)}>Fine</button>
    </div>
  {/if}

  <main class:picking={ui.pick}>
    <div class="content">
      {#if failed}
        <div class="msg">
          <h2>Non trovo il vocabolario dei simboli</h2>
          <p>Crea i file in <code>public/data/</code> con <code>uv run scripts/build_index.py</code> e <code>uv run scripts/build_forme.py</code>.</p>
        </div>
      {:else if !ready}
        <div class="msg"><p>Carico i simboli…</p></div>
      {:else}
        {#key doc.id}
          {#if settings.mode === 'split'}
            <SplitView bind:this={editor} {lines} {view} onchange={change} />
          {:else}
            <div class="page"><SymWriter bind:this={editor} {lines} {view} onchange={change} /></div>
          {/if}
        {/key}
      {/if}
    </div>
    {#if ready}<Picker {lines} {view} onchange={change} />{/if}
  </main>
  <p class="credit">Pittogrammi: Sergio Palao. Origine: ARASAAC (https://arasaac.org). Licenza: CC (BY-NC-SA). Proprietà: Governo d'Aragona (Spagna).</p>
</div>

<svelte:window {onkeydown} />

<Modal name="settings" title="Impostazioni"><Settings /></Modal>
<Modal name="files" title="I miei testi"><Files /></Modal>
<Modal name="qr" title="QR code"><Qr /></Modal>
<Modal name="install" title="Installa l'app"><Install /></Modal>

{#if ui.toast}<div class="toast no-print" role="status">{ui.toast}</div>{/if}

<style>
  .app { display: flex; flex-direction: column; height: 100dvh; }

  .top {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 10px 16px; background: var(--surface); border-bottom: 1px solid var(--line);
  }
  .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .logo { display: flex; flex: none; border-radius: 11px; }
  .names { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .names small { color: var(--muted); font-size: .78rem; font-weight: 700; letter-spacing: .02em; padding-left: 8px; }
  .namebox {
    display: flex; align-items: center; gap: 4px; width: fit-content; max-width: min(100%, 460px); padding-right: 8px;
    border: 1.5px solid transparent; border-radius: 9px; color: var(--muted); cursor: text;
  }
  .namebox:hover { border-color: var(--line); }
  .namebox:focus-within { border-color: var(--accent); background: var(--raised); }
  .name {
    min-width: 0; max-width: 100%; min-height: 34px; padding: 0 0 0 8px; margin: 0;
    border: 0; outline: none; background: none; color: var(--ink);
    font-size: 1.15rem; font-weight: 700; text-overflow: ellipsis;
  }
  .name::placeholder { color: var(--ink); opacity: 1; }
  .brand { flex: 1; }
  nav { display: flex; gap: 2px; }
  .narrow { display: none; }

  .tools {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 8px 16px; background: var(--bg); border-bottom: 1px solid var(--line);
  }
  .modes { display: flex; padding: 4px; gap: 4px; background: var(--soft); border-radius: 14px; }
  .modes button {
    display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px;
    border: 0; border-radius: 10px; background: none; color: var(--muted); font-weight: 700;
  }
  .modes button[aria-checked='true'] { background: var(--raised); color: var(--ink); box-shadow: 0 0 0 2px var(--accent); }
  .group { display: flex; align-items: center; gap: 2px; }
  .ai { min-height: 40px; color: var(--accent); }
  .zoom { margin-left: auto; }
  .sel { display: none; }
  .selbar {
    display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 16px;
    background: var(--accent-soft); border-bottom: 1px solid var(--line); font-weight: 700;
  }
  .selbar span { flex: 1; }
  .pct { min-width: 64px; min-height: 40px; border: 0; background: none; font-weight: 700; font-variant-numeric: tabular-nums; border-radius: 10px; }
  .pct:hover { background: var(--soft); }

  main { flex: 1; min-height: 0; display: flex; }
  .content { flex: 1; min-width: 0; overflow: hidden; }
  .content > :global(*) { height: 100%; }
  .page { overflow: auto; padding: 28px clamp(16px, 4vw, 56px); }
  .msg { display: grid; place-content: center; text-align: center; color: var(--muted); padding: 24px; }
  code { background: var(--soft); padding: 2px 6px; border-radius: 6px; }

  .credit { display: none; }

  .toast {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 50;
    padding: 12px 20px; border-radius: 14px; background: var(--ink); color: var(--bg); font-weight: 700;
    box-shadow: var(--shadow);
  }

  @media (max-width: 1100px) {
    nav, .ai, .pct { display: none; }
    .narrow { display: block; }
  }
  @media (max-width: 760px) {
    .top { padding: 8px 10px; }
    .names small { display: none; }
    .ai span { display: none; }
    .tools :global(.btn.ai) { width: 38px; padding: 0; }
    .tools { padding: 6px 8px; gap: 2px; flex-wrap: nowrap; }
    .tools :global(.btn.icon) { width: 38px; }
    .sel { display: inline-flex; }
    .redo { display: none; }
    .modes button span { display: none; }
    .modes button { padding: 0 9px; }
    .pct { display: none; }
    .page { padding: 14px; }
  }
  @media screen and (max-width: 900px) {
    main.picking .content :global(.page), main.picking .content :global(.preview) { padding-bottom: 64vh; }
  }
  @media (max-width: 520px) {
    .logo { display: none; }
    .top { gap: 4px; }
  }
  @media (max-width: 420px) {
    .li { display: none; }
    .tools :global(.btn.icon) { width: 36px; }
  }

  @media print {
    .app { display: block; height: auto; }
    main, .content { display: block; overflow: visible; }
    .content > :global(*) { height: auto; }
    .page { padding: 0; overflow: visible; }
    .credit { display: block; margin: 8mm 0 0; font-size: 8pt; color: #555; }
  }
</style>
