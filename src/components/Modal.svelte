<script>
  import Icon from './Icon.svelte'
  import { ui } from '../lib/state.svelte.js'

  let { name, title, children, onclose } = $props()
  let dialog

  $effect(() => {
    if (ui.dialog === name && !dialog.open) dialog.showModal()
    if (ui.dialog !== name && dialog.open) dialog.close()
  })
</script>

<dialog bind:this={dialog} onclose={() => { if (ui.dialog === name) ui.dialog = null; onclose?.() }}
  onclick={e => e.target === dialog && dialog.close()} class="no-print">
  <div class="box">
    <header>
      <h2>{title}</h2>
      <button class="btn icon ghost" onclick={() => dialog.close()} aria-label="Chiudi"><Icon name="close" /></button>
    </header>
    <div class="body">
      {#if ui.dialog === name}{@render children()}{/if}
    </div>
  </div>
</dialog>

<style>
  dialog {
    width: min(620px, calc(100vw - 32px)); max-height: calc(100dvh - 48px);
    padding: 0; border: 0; border-radius: 22px;
    background: var(--surface); color: var(--ink); box-shadow: var(--shadow);
  }
  dialog::backdrop { background: rgb(20 16 8 / .45); }
  .box { display: flex; flex-direction: column; max-height: calc(100dvh - 48px); }
  header { display: flex; align-items: center; justify-content: space-between; padding: 16px 14px 8px 24px; }
  h2 { margin: 0; font-size: 1.35rem; }
  .body { overflow: auto; padding: 8px 24px 24px; }
  @media (max-width: 600px) {
    dialog { width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh; margin: 0; border-radius: 0; }
    .box { max-height: 100dvh; height: 100%; }
    .body { padding: 8px 16px 24px; }
  }
</style>
