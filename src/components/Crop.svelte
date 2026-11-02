<script>
  import Icon from './Icon.svelte'
  import { render } from '../lib/images.svelte.js'

  // src: url dell'immagine scelta;  onsave(dataUrl) con il quadrato ritagliato
  let { src, onsave, oncancel } = $props()

  const F = 280                         // lato del riquadro di ritaglio (px)
  let img = $state(), frame
  let s = $state(1), x = $state(0), y = $state(0)
  let fit = $state(1)                   // scala che mostra l'immagine intera
  const pts = new Map()

  function load() {
    const w = img.naturalWidth, h = img.naturalHeight
    fit = F / Math.max(w, h)
    whole()
  }

  function whole() {
    s = fit
    x = (F - img.naturalWidth * s) / 2
    y = (F - img.naturalHeight * s) / 2
  }

  // ingrandisce di f tenendo fermo il punto (cx, cy) del riquadro
  function zoomAt(f, cx = F / 2, cy = F / 2) {
    f = Math.min(Math.max(f, (fit / 2) / s), (fit * 8) / s)
    x = cx - (cx - x) * f
    y = cy - (cy - y) * f
    s *= f
  }

  const local = e => { const r = frame.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

  function down(e) {
    frame.setPointerCapture(e.pointerId)
    pts.set(e.pointerId, local(e))
  }

  // un dito sposta, due dita ingrandiscono
  function move(e) {
    if (!pts.has(e.pointerId)) return
    const before = [...pts.values()]
    pts.set(e.pointerId, local(e))
    const after = [...pts.values()]
    if (after.length === 1) {
      x += after[0].x - before[0].x
      y += after[0].y - before[0].y
    } else {
      const [a0, b0] = before, [a, b] = after, m0 = mid(a0, b0), m = mid(a, b)
      x += m.x - m0.x
      y += m.y - m0.y
      zoomAt(dist(a, b) / dist(a0, b0), m.x, m.y)
    }
  }

  const up = e => pts.delete(e.pointerId)

  function wheel(e) {
    e.preventDefault()
    const p = local(e)
    zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, p.x, p.y)
  }
</script>

<p class="hint">Sposta l'immagine con il dito o il mouse e ingrandiscila: diventerà il simbolo così come la vedi nel riquadro.</p>

<div class="frame" bind:this={frame} style="width:{F}px;height:{F}px"
  onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onwheel={wheel}>
  <img bind:this={img} {src} alt="" onload={load} draggable="false"
    style="transform:translate({x}px,{y}px) scale({s})" />
</div>

<div class="zoom">
  <Icon name="minus" size={18} />
  <input type="range" min={Math.log(fit / 2)} max={Math.log(fit * 8)} step="0.01" value={Math.log(s)}
    oninput={e => zoomAt(Math.exp(+e.target.value) / s)} aria-label="Ingrandimento" />
  <Icon name="plus" size={18} />
</div>

<div class="bar">
  <button class="btn ghost" onclick={whole}><Icon name="image" /> Intera</button>
  <span></span>
  <button class="btn" onclick={oncancel}>Annulla</button>
  <button class="btn primary" onclick={() => onsave(render(img, x, y, s, F))}>Usa come simbolo</button>
</div>

<style>
  .hint { color: var(--muted); margin: 0 0 16px; }
  .frame {
    position: relative; margin: 0 auto; overflow: hidden; touch-action: none; cursor: grab;
    background: #fff; border-radius: 10px;
    box-shadow: 0 0 0 1px var(--line), 0 0 0 4px var(--sun);
  }
  .frame:active { cursor: grabbing; }
  img { position: absolute; left: 0; top: 0; transform-origin: 0 0; max-width: none; user-select: none; pointer-events: none; }
  .zoom { display: flex; align-items: center; gap: 10px; max-width: 320px; margin: 18px auto; color: var(--muted); }
  .zoom input { flex: 1; accent-color: var(--accent); height: 28px; }
  .bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .bar span { flex: 1; }
  .bar .primary { flex: 1 1 200px; }   /* sul telefono va a capo e occupa tutta la riga */
</style>
