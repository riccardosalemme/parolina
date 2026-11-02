<script>
  import Card from './Card.svelte'
  import { settings, DEFAULTS, sheetStyle } from '../lib/state.svelte.js'
  import { getTheme, setTheme } from '../lib/theme.js'

  let theme = $state(getTheme())
  const THEMES = [['auto', 'Automatico'], ['light', 'Chiaro'], ['dark', 'Scuro']]

  const COLORS = ['#1f1a16', '#f08a5d', '#2756c5', '#15803d', '#7c3aed', '#d4a106']
  const sample = { id: 2317, tokens: [{ w: 'la' }, { w: 'casa' }], core: 0 }
</script>

<div class="sample sheet" style="{sheetStyle()};--zoom:1">
  <div class="row"><Card card={sample} /><Card card={{ ...sample, id: 6456, tokens: [{ w: 'mangiare' }] }} /></div>
</div>

<section>
  <h3>Aspetto</h3>
  <div class="field">
    <span>Tema</span>
    <div class="seg">
      {#each THEMES as [id, label]}
        <button aria-pressed={theme === id} onclick={() => { theme = id; setTheme(id) }}>{label}</button>
      {/each}
    </div>
  </div>
</section>

<section>
  <h3>Simboli</h3>
  <div class="field">
    <span>Posizione</span>
    <div class="seg">
      <button aria-pressed={settings.position === 'top'} onclick={() => (settings.position = 'top')}>Sopra la parola</button>
      <button aria-pressed={settings.position === 'bottom'} onclick={() => (settings.position = 'bottom')}>Sotto la parola</button>
    </div>
  </div>
  <label class="field">
    <span>Grandezza simboli <b>{settings.symbolSize}</b></span>
    <input type="range" min="48" max="240" step="4" bind:value={settings.symbolSize} />
  </label>
</section>

<section>
  <h3>Testo</h3>
  <label class="field">
    <span>Grandezza testo <b>{settings.textSize}</b></span>
    <input type="range" min="12" max="64" step="1" bind:value={settings.textSize} />
  </label>
  <label class="check"><input type="checkbox" bind:checked={settings.upper} /> STAMPATO MAIUSCOLO</label>
  <label class="check"><input type="checkbox" bind:checked={settings.markdown} /> Mostra il markdown <i>(per utenti esperti)</i></label>
</section>

<section>
  <h3>Riquadro</h3>
  <label class="check"><input type="checkbox" bind:checked={settings.frame} /> Riquadro attorno a simbolo e parola</label>
  {#if settings.frame}
    <label class="field">
      <span>Spessore <b>{settings.frameWidth}</b></span>
      <input type="range" min="1" max="10" step="1" bind:value={settings.frameWidth} />
    </label>
    <div class="field">
      <span>Colore</span>
      <div class="colors">
        {#each COLORS as c}
          <button class="swatch" style="background:{c}" aria-pressed={settings.frameColor === c}
            onclick={() => (settings.frameColor = c)} aria-label="Colore {c}"></button>
        {/each}
        <input type="color" bind:value={settings.frameColor} aria-label="Altro colore" />
      </div>
    </div>
  {/if}
</section>

<section>
  <h3>Raggruppa automaticamente</h3>
  <label class="check"><input type="checkbox" bind:checked={settings.articles} /> Articolo e parola insieme <i>(la casa)</i></label>
  <label class="check"><input type="checkbox" bind:checked={settings.verbs} /> Verbi con ausiliare insieme <i>(ho mangiato, mi lavo)</i></label>
</section>

<p class="about">
  Simboli di <a href="https://arasaac.org" target="_blank" rel="noopener">ARASAAC</a>: autore Sergio Palao, proprietà
  Governo d'Aragona (Spagna), licenza CC BY-NC-SA. I testi restano solo su questo dispositivo.
</p>

<button class="btn ghost reset" onclick={() => Object.assign(settings, { ...DEFAULTS, mode: settings.mode })}>
  Ripristina le impostazioni iniziali
</button>

<style>
  .sample { min-height: 0; padding: 18px; margin-bottom: 8px; display: flex; justify-content: center; overflow: hidden; box-shadow: 0 0 0 1px var(--line); }
  .sample .row { margin: 0; justify-content: center; }
  section { padding: 14px 0; border-bottom: 1px solid var(--line); }
  h3 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 4px 0 12px; }
  .field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .field > span { font-weight: 700; display: flex; justify-content: space-between; }
  .field b { color: var(--muted); font-variant-numeric: tabular-nums; }
  input[type='range'] { width: 100%; accent-color: var(--accent); height: 28px; }
  .check { display: flex; align-items: center; gap: 12px; min-height: 44px; font-weight: 700; }
  .check i { font-weight: 400; color: var(--muted); }
  .check input { width: 22px; height: 22px; accent-color: var(--accent); }
  .seg { display: flex; padding: 4px; gap: 4px; background: var(--soft); border-radius: 12px; }
  .seg button { flex: 1; min-height: 40px; border: 0; border-radius: 9px; background: none; font-weight: 700; color: var(--muted); }
  .seg button[aria-pressed='true'] { background: var(--raised); color: var(--ink); box-shadow: 0 0 0 2px var(--accent); }
  .colors { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .swatch { width: 36px; height: 36px; border-radius: 50%; border: 3px solid var(--surface); box-shadow: 0 0 0 1.5px var(--line); }
  .swatch[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--ink); }
  input[type='color'] { width: 44px; height: 36px; border: 0; background: none; padding: 0; }
  .about { color: var(--muted); font-size: .88rem; margin: 16px 0 0; }
  .about a { color: inherit; }
  .reset { margin-top: 14px; color: var(--muted); }
</style>
