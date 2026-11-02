<script>
  import Card from './Card.svelte'
  import { ui, sheetStyle } from '../lib/state.svelte.js'

  let { view } = $props()

  const selected = (li, c) => ui.pick?.line === li && c.start <= ui.pick.at && ui.pick.at < c.end
</script>

<div class="sheet" style={sheetStyle()}>
  {#if !view.some(l => l.cards.length)}<p class="empty-sheet no-print">I simboli compariranno qui mentre scrivi.</p>{/if}
  {#each view as l, li}
    <div class="row {l.kind}">
      {#if l.kind === 'li'}<span class="bullet">•</span>{/if}
      {#each l.cards as c (c.start)}
        <Card card={c} selected={selected(li, c)} onpick={() => (ui.pick = { line: li, at: c.core })} />
      {/each}
    </div>
  {/each}
</div>
