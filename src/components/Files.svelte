<script>
  import Icon from './Icon.svelte'
  import { docs, doc, ui, openDoc, newDoc, deleteDoc, addDocs, docName, toast } from '../lib/state.svelte.js'
  import { download, downloadMd, readTexts, exportAll } from '../lib/files.js'
  import { images } from '../lib/images.svelte.js'

  let picker

  const when = t => new Date(t).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const close = () => (ui.dialog = null)

  async function importFiles(e) {
    const n = addDocs(await readTexts(e.target.files))
    e.target.value = ''
    toast(n ? `${n} ${n === 1 ? 'testo importato' : 'testi importati'}` : 'Nessun testo nuovo')
  }

  function remove(d) {
    if (confirm(`Eliminare «${docName(d)}»?`)) deleteDoc(d.id)
  }

  const nImages = $derived(Object.keys(images).length)
</script>

<div class="bar">
  <button class="btn primary" onclick={() => { newDoc(); close() }}><Icon name="plus" /> Nuovo testo</button>
  <button class="btn" onclick={() => picker.click()}><Icon name="upload" /> Importa</button>
  <button class="btn" onclick={() => download('parolina-testi.json', exportAll(docs), 'application/json')} disabled={!docs.length}>
    <Icon name="download" /> Esporta tutti
  </button>
  <input bind:this={picker} type="file" accept=".md,.txt,.json,text/markdown,text/plain,application/json" multiple hidden onchange={importFiles} />
</div>

{#if docs.length}
  <ul>
    {#each docs as d (d.id)}
      <li class:current={d.id === doc.id}>
        <button class="open" onclick={() => { openDoc(d.id); close() }}>
          <strong>{docName(d)}</strong>
          <small>{d.id === doc.id ? 'Aperto ora · ' : ''}{when(d.updated)}</small>
        </button>
        <button class="btn icon ghost" onclick={() => downloadMd(docName(d), d.md)} aria-label="Scarica {docName(d)}" title="Scarica .md"><Icon name="download" /></button>
        <button class="btn icon ghost danger" onclick={() => remove(d)} aria-label="Elimina {docName(d)}" title="Elimina"><Icon name="trash" /></button>
      </li>
    {/each}
  </ul>
{:else}
  <p class="empty">Non ci sono ancora testi salvati.</p>
{/if}
<p class="note">
  I testi{nImages ? ` e le tue ${nImages} immagini` : ''} restano salvati in questo browser.
  Usa <b>Esporta tutti</b> per portarli su un altro dispositivo: il file contiene anche le immagini personali.
</p>

<style>
  .bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  li { display: flex; align-items: center; gap: 2px; padding: 4px 4px 4px 0; border-radius: 14px; background: var(--raised); box-shadow: 0 0 0 1px var(--line); }
  li.current { box-shadow: 0 0 0 2px var(--accent); }
  .open { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 14px; border: 0; background: none; text-align: left; }
  .open strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
  small { color: var(--muted); }
  .empty, .note { color: var(--muted); }
  .note { font-size: .9rem; margin: 16px 0 0; }
</style>
