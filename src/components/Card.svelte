<script>
  import Symbol from './Symbol.svelte'

  // onpick: tocco sul simbolo;  onedit: tocco sulla parola (se assente, anche la parola apre il simbolo)
  let { card, selected = false, onpick, onedit } = $props()
</script>

<div class="card" class:selected data-at={card.core}>
  <button class="pic" class:empty={!card.id} onclick={onpick} title="Cambia simbolo">
    {#if card.id}<Symbol id={card.id} />{/if}
  </button>
  <button class="lbl" onclick={onedit ?? onpick} tabindex={onedit ? 0 : -1}>
    {#each card.tokens as t, n}{n ? ' ' : ''}<span class:b={t.b} class:i={t.i}>{t.w}</span>{/each}
  </button>
</div>
