<script>
  import Icon from './Icon.svelte'
  import Symbol from './Symbol.svelte'
  import Modal from './Modal.svelte'
  import Crop from './Crop.svelte'
  import * as lex from '../lib/lexicon.js'
  import * as ed from '../lib/edit.js'
  import { plain } from '../lib/md.js'
  import { images, addImage, removeImage, imagesFor, recent } from '../lib/images.svelte.js'
  import { imagePrompt } from '../lib/prompts.js'
  import { copy } from '../lib/files.js'
  import { FEEDBACK, feedbackUrl } from '../lib/feedback.js'
  import { ui, toast, FULL } from '../lib/state.svelte.js'

  let { lines, view, onchange } = $props()

  let q = $state('')
  let crop = $state(null)     // url dell'immagine da ritagliare
  let file

  const line = $derived(ui.pick?.line)
  const cards = $derived(view[line]?.cards ?? [])
  const card = $derived(cards.find(c => c.start <= ui.pick.at && ui.pick.at < c.end))
  const next = $derived(card && cards.find(c => c.start === card.end))
  const words = c => c.tokens.slice(c.core - c.start).map(t => t.w).join(' ')
  const options = $derived(card ? [...new Set([...imagesFor(words(card)), ...lex.candidates(card.keys)])] : [])
  const mine = $derived(card ? recent() : [])
  const results = $derived(lex.search(q))
  const many = $derived(card && (card.end - card.start > 1 || /\s/.test(card.tokens[0].w)))

  $effect(() => { if (ui.pick && !card) ui.pick = null })
  $effect(() => { ui.pick?.line; ui.pick?.at; q = '' })
  // la card scelta resta visibile (dopo che la pagina si e' sistemata)
  $effect(() => {
    if (!card) return
    ui.pick.line; ui.pick.at
    const t = setTimeout(() => document.querySelector('.card.selected')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 80)
    return () => clearTimeout(t)
  })

  const report = $derived(card && FEEDBACK ? feedbackUrl('simbolo', lex.norm(words(card)), card.id ?? '') : '')

  const run = fn => onchange(fn(lines, line, card))
  const choose = id => run((l, n, c) => ed.assign(l, n, c, id))

  function pickFile(e) {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    crop = URL.createObjectURL(f)
    ui.dialog = 'crop'
  }

  function closeCrop() {
    URL.revokeObjectURL(crop)
    crop = null
    ui.dialog = null
  }

  function saveCrop(data) {
    const id = addImage(data, lex.norm(words(card)))
    if (id) choose(id)
    else toast(FULL)
    closeCrop()
  }

  function forget(id) {
    if (confirm(`Eliminare l'immagine «${images[id].name}»? Sparirà anche dai testi che la usano.`)) removeImage(id)
  }

  async function prompt() {
    await copy(imagePrompt(words(card), card.keys[0], plain([lines[line]])))
    toast("Prompt copiato: incollalo nell'IA, poi importa l'immagine")
  }
</script>

{#if card}
  <aside class="picker no-print" aria-label="Scegli il simbolo">
    <header>
      <div class="now">
        <div class="big" class:empty={!card.id}>{#if card.id}<Symbol id={card.id} />{/if}</div>
        <div>
          <small>Simbolo per</small>
          <h2>{words(card)}</h2>
          {#if card.keys[0] && lex.norm(words(card)) !== card.keys[0]}<small>come «{card.keys[0]}»</small>{/if}
        </div>
      </div>
      <button class="btn icon ghost" onclick={() => (ui.pick = null)} aria-label="Chiudi"><Icon name="close" /></button>
    </header>

    <div class="actions">
      {#if next}
        <button class="btn" onclick={() => run((l, n, c) => ed.merge(l, n, c, next))}>
          <Icon name="link" size={18} /> Unisci a «{words(next)}»
        </button>
      {/if}
      {#if many}
        <button class="btn" onclick={() => run(ed.split)}><Icon name="scissors" size={18} /> Separa</button>
      {/if}
      {#if card.id}
        <button class="btn" onclick={() => choose(0)}><Icon name="ban" size={18} /> Nessun simbolo</button>
      {/if}
      {#if card.explicit}
        <button class="btn" onclick={() => run(ed.reset)}><Icon name="auto" size={18} /> Automatico</button>
      {/if}
    </div>

    <div class="scroll">
      {#if !options.length}
        <div class="missing">
          <p>Non ho trovato un simbolo per «{words(card)}». Cercane uno qui sotto, usa una tua immagine{report ? ' o segnalalo' : ''}.</p>
          {#if report}
            <a class="btn" href={report} target="_blank" rel="noopener"><Icon name="message" size={18} /> Segnala un simbolo mancante</a>
          {/if}
        </div>
      {:else}
        <h3>Suggeriti</h3>
        <div class="grid">
          {#each options as id (id)}
            <button class="opt" class:on={id === card.id} onclick={() => choose(id)} aria-label="Simbolo {id}">
              <Symbol {id} lazy />
            </button>
          {/each}
        </div>
      {/if}

      <h3>Cerca un altro simbolo</h3>
      <label class="search">
        <Icon name="search" size={20} />
        <input type="search" bind:value={q} placeholder="es. pianoforte" autocomplete="off" />
      </label>
      {#if q.trim().length >= 2}
        <div class="grid">
          {#each results as r (r.id)}
            <button class="opt" class:on={r.id === card.id} onclick={() => choose(r.id)}>
              <Symbol id={r.id} lazy />
              <span>{r.label}</span>
            </button>
          {:else}
            <p class="none">Nessun simbolo trovato.</p>
          {/each}
        </div>
      {/if}

      <h3>Le mie immagini</h3>
      <div class="grid">
        <button class="opt add" onclick={() => file.click()}>
          <Icon name="upload" size={30} />
          <span>Importa immagine</span>
        </button>
        {#each mine as id (id)}
          <div class="own">
            <button class="opt" class:on={id === card.id} onclick={() => choose(id)}>
              <Symbol {id} />
              <span>{images[id].name}</span>
            </button>
            <button class="del" onclick={() => forget(id)} aria-label="Elimina {images[id].name}"><Icon name="close" size={14} /></button>
          </div>
        {/each}
      </div>
      <input bind:this={file} type="file" accept="image/*" hidden onchange={pickFile} />
      <button class="btn ghost ai" onclick={prompt}>
        <Icon name="sparkle" size={18} /> Copia il prompt per crearla con l'IA
      </button>
      {#if report && options.length}
        <a class="btn ghost ai" href={report} target="_blank" rel="noopener">
          <Icon name="message" size={18} /> Segnala un simbolo mancante
        </a>
      {/if}
    </div>
  </aside>

  <Modal name="crop" title="Ritaglia l'immagine" onclose={closeCrop}>
    {#if crop}<Crop src={crop} onsave={saveCrop} oncancel={closeCrop} />{/if}
  </Modal>
{/if}

<style>
  .picker {
    width: 380px; flex: none;
    display: flex; flex-direction: column; min-height: 0;
    background: var(--surface); border-left: 1px solid var(--line);
  }
  header {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
    padding: 16px 12px 12px 18px;
  }
  .now { display: flex; gap: 14px; align-items: center; min-width: 0; }
  .big {
    width: 84px; height: 84px; flex: none; padding: 6px;
    background: #fff; border-radius: 12px; border: 1.5px solid var(--line);
  }
  .big.empty { border-style: dashed; }
  .big :global(img) { width: 100%; height: 100%; object-fit: contain; }
  h2 { margin: 2px 0; font-size: 1.35rem; overflow-wrap: anywhere; }
  small { color: var(--muted); font-size: .85rem; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px 14px; border-bottom: 1px solid var(--line); }
  .actions .btn { min-height: 40px; font-size: .92rem; }
  .actions:empty { display: none; }
  .scroll { overflow: auto; padding: 4px 18px 24px; }
  h3 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 18px 0 10px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; }
  .opt {
    width: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 6px; background: #fff; color: #222;
    border: 2px solid transparent; border-radius: 12px;
    box-shadow: 0 0 0 1px var(--line);
  }
  .opt :global(img), .opt :global(.missing) { width: 100%; aspect-ratio: 1; object-fit: contain; }
  .opt span { font-size: .78rem; line-height: 1.1; text-align: center; overflow-wrap: anywhere; }
  .opt:hover { box-shadow: 0 0 0 2px var(--muted); }
  .opt.on { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent); }
  .opt.add {
    justify-content: center; min-height: 100px; background: var(--raised); color: var(--accent);
    box-shadow: none; border: 2px dashed var(--line); font-weight: 700;
  }
  .opt.add span { font-size: .8rem; overflow-wrap: normal; }
  .own { position: relative; }
  .del {
    position: absolute; top: -6px; right: -6px; width: 26px; height: 26px; display: grid; place-items: center;
    border: 0; border-radius: 50%; background: var(--ink); color: var(--bg); opacity: .75;
  }
  .del:hover { opacity: 1; background: var(--danger); }
  .missing { margin-top: 16px; padding: 14px; border-radius: 14px; background: var(--accent-soft); }
  .missing p { margin: 0 0 10px; }
  .missing .btn { min-height: 40px; font-size: .92rem; }
  .ai { margin-top: 10px; width: 100%; color: var(--accent); font-size: .92rem; white-space: normal; }
  .search {
    display: flex; align-items: center; gap: 8px; padding: 0 12px;
    border: 1.5px solid var(--line); border-radius: 12px; background: var(--raised);
    color: var(--muted); margin-bottom: 12px;
  }
  .search:focus-within { border-color: var(--accent); }
  .search input { flex: 1; min-height: 46px; border: 0; outline: none; background: none; color: var(--ink); }
  .none { color: var(--muted); grid-column: 1 / -1; }

  @media (max-width: 900px) {
    .picker {
      position: fixed; inset: auto 0 0 0; z-index: 20; width: auto;
      max-height: 62vh; border-left: 0; border-radius: 20px 20px 0 0;
      box-shadow: 0 -10px 40px rgb(0 0 0 / .18);
    }
    header { padding-top: 14px; }
    .big { width: 64px; height: 64px; }
    .grid { grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); }
  }
</style>
