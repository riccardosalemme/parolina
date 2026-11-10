<script>
  import { ios, firefox, android } from '../lib/install.svelte.js'
</script>

<p>Con l'app installata apri Parolina dalla schermata Home, come le altre app.</p>

{#if ios}
  <ol>
    <li>Apri questa pagina con <b>Safari</b>.</li>
    <li>Tocca <b>Condividi</b> (il quadrato con la freccia in su).</li>
    <li>Tocca <b>Aggiungi alla schermata Home</b>, poi <b>Aggiungi</b>.</li>
  </ol>
{:else if firefox && android}
  <ol>
    <li>Tocca il menu di Firefox (<b>⋮</b>).</li>
    <li>Tocca <b>Aggiungi alla schermata Home</b> (o <b>Installa</b>).</li>
  </ol>
{:else if firefox}
  <p>Per installare l'app apri Parolina con <b>Chrome</b> o <b>Edge</b> e usa il tasto <b>Installa</b>.</p>
{:else}
  <ol>
    <li>Apri il menu del browser.</li>
    <li>Tocca <b>Installa app</b> o <b>Aggiungi alla schermata Home</b>.</li>
  </ol>
{/if}

<style>
  ol { padding-left: 1.4em; line-height: 1.6; }
  li { margin-bottom: 8px; }
</style>
