<script>
  import Icon from './Icon.svelte'

  // items: [{ icon, label, run } | { icon, label, href }]
  let { items } = $props()
  let open = $state(false)
  let box

  const close = () => (open = false)

  $effect(() => {
    if (!open) return
    const outside = e => { if (!box.contains(e.target)) close() }
    const esc = e => { if (e.key === 'Escape') close() }
    addEventListener('pointerdown', outside)
    addEventListener('keydown', esc)
    return () => { removeEventListener('pointerdown', outside); removeEventListener('keydown', esc) }
  })
</script>

<div class="menu" bind:this={box}>
  <button class="btn" aria-haspopup="menu" aria-expanded={open} onclick={() => (open = !open)}>
    <Icon name={open ? 'close' : 'menu'} /><span>Menu</span>
  </button>
  {#if open}
    <div class="list" role="menu">
      {#each items as it}
        {#if it.href}
          <a role="menuitem" href={it.href} target="_blank" rel="noopener" onclick={close}><Icon name={it.icon} />{it.label}</a>
        {:else}
          <button role="menuitem" onclick={() => { close(); it.run() }}><Icon name={it.icon} />{it.label}</button>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .menu { position: relative; flex: none; }
  .list {
    position: absolute; right: 0; top: calc(100% + 8px); z-index: 40;
    width: min(290px, calc(100vw - 20px)); padding: 6px;
    background: var(--surface); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--shadow);
  }
  .list > * {
    display: flex; align-items: center; gap: 14px; width: 100%; min-height: 50px; padding: 0 14px;
    border: 0; border-radius: 12px; background: none; color: var(--ink);
    font-weight: 700; text-align: left; text-decoration: none;
  }
  .list > :hover { background: var(--soft); }
  .list :global(svg) { color: var(--accent); flex: none; }
</style>
