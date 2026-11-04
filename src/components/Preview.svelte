<script>
  import Card from './Card.svelte'
  import { ui, sheetStyle, marked, tapSelect } from '../lib/state.svelte.js'

  let { view } = $props()

  const tap = (li, c) => (ui.select ? tapSelect(li, c) : (ui.pick = { line: li, at: c.core }))
</script>

<div class="sheet" style={sheetStyle()}>
  {#if !view.some(l => l.cards.length)}<p class="empty-sheet no-print">I simboli compariranno qui mentre scrivi.</p>{/if}
  {#each view as l, li}
    <div class="row {l.kind}">
      {#if l.kind === 'li'}<span class="bullet">•</span>{/if}
      {#each l.cards as c (c.start)}
        <Card card={c} selected={marked(li, c)} onpick={() => tap(li, c)} />
      {/each}
    </div>
  {/each}
</div>
