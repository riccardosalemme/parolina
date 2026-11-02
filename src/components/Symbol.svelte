<script>
  import { images } from '../lib/images.svelte.js'
  import { symbolUrl, remote, isImage } from '../lib/symbols.js'

  let { id, alt = '', lazy = false } = $props()

  const src = $derived(isImage(id) ? images[id]?.data : symbolUrl(id))

  // se manca il file locale, lo prendo dal sito ARASAAC
  const fallback = e => { if (!isImage(id) && e.currentTarget.src !== remote(id)) e.currentTarget.src = remote(id) }
</script>

{#if src}
  <img {src} {alt} loading={lazy ? 'lazy' : 'eager'} draggable="false" onerror={fallback} />
{:else}
  <span class="missing" title="Immagine non presente su questo dispositivo">?</span>
{/if}

<style>
  .missing {
    display: grid; place-items: center; width: 100%; height: 100%;
    border: 2px dashed #d3cec4; border-radius: 6px; color: #b0aa9e; font-size: 2em; font-weight: 700;
  }
</style>
