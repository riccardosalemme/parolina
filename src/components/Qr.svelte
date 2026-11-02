<script>
  import { onDestroy } from 'svelte'
  import Icon from './Icon.svelte'
  import { doc, ui, newDoc, docName, toast } from '../lib/state.svelte.js'
  import { link, qrImage, scan, fromLink } from '../lib/qr.js'
  import { download, fileName } from '../lib/files.js'

  let tab = $state('show')
  let qr = $state(null), url = $state(''), error = $state('')
  let video = $state(), stream = null, timer = null, camError = $state('')

  $effect(() => {
    const md = doc.md
    link(md).then(u => {
      url = u
      try { qr = qrImage(u); error = '' } catch { qr = null; error = 'Il testo è troppo lungo per un QR code: prova a dividerlo in più testi.' }
    })
  })

  async function share() {
    if (navigator.share) return navigator.share({ title: docName(doc), url }).catch(() => {})
    await navigator.clipboard.writeText(url)
    toast('Link copiato')
  }

  async function found(text) {
    const md = (await fromLink(text).catch(() => null)) ?? text
    stop()
    newDoc(md)
    ui.dialog = null
    toast('Testo aperto dal QR code')
  }

  async function start() {
    camError = ''
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      video.srcObject = stream
      await video.play()
      timer = setInterval(async () => {
        const text = video.readyState >= 2 && await scan(video).catch(() => null)
        if (text) found(text)
      }, 350)
    } catch {
      camError = 'Non riesco ad usare la fotocamera. Puoi scegliere una foto del QR code.'
    }
  }

  function stop() {
    clearInterval(timer)
    stream?.getTracks().forEach(t => t.stop())
    stream = null
  }

  async function fromPhoto(e) {
    const f = e.target.files[0]
    if (!f) return
    const img = new Image()
    img.src = URL.createObjectURL(f)
    await img.decode()
    const text = await scan(img).catch(() => null)
    text ? found(text) : (camError = 'Nella foto non trovo un QR code.')
  }

  $effect(() => { tab === 'scan' ? start() : stop() })
  onDestroy(stop)
</script>

<div class="seg" role="tablist">
  <button role="tab" aria-selected={tab === 'show'} onclick={() => (tab = 'show')}><Icon name="qr" size={20} /> Crea QR</button>
  <button role="tab" aria-selected={tab === 'scan'} onclick={() => (tab = 'scan')}><Icon name="camera" size={20} /> Leggi QR</button>
</div>

{#if tab === 'show'}
  {#if qr}
    <img class="code" src={qr.url} alt="QR code del testo" />
    <p class="note">Inquadralo con la fotocamera del telefono: si apre Parolina con questo testo.</p>
    {#if /symbol:img-/.test(doc.md)}
      <p class="note warn">Le immagini personali non entrano nel QR code: per portarle su un altro dispositivo usa <b>I miei testi → Esporta tutti</b>.</p>
    {/if}
    <div class="bar">
      <button class="btn primary" onclick={() => download(fileName(docName(doc), '.png'), qr.url)}><Icon name="download" /> Scarica immagine</button>
      <button class="btn" onclick={share}><Icon name="share" /> {navigator.share ? 'Condividi link' : 'Copia link'}</button>
    </div>
  {:else}
    <p class="note">{error}</p>
  {/if}
{:else}
  <div class="cam">
    <!-- svelte-ignore a11y_media_has_caption -->
    <video bind:this={video} playsinline muted></video>
    <span class="frame"></span>
  </div>
  {#if camError}<p class="note">{camError}</p>{/if}
  <label class="btn"><Icon name="image" /> Scegli una foto<input type="file" accept="image/*" hidden onchange={fromPhoto} /></label>
{/if}

<style>
  .seg { display: flex; padding: 4px; gap: 4px; background: var(--soft); border-radius: 12px; margin-bottom: 18px; }
  .seg button { flex: 1; display: flex; gap: 8px; align-items: center; justify-content: center; min-height: 42px; border: 0; border-radius: 9px; background: none; font-weight: 700; color: var(--muted); }
  .seg button[aria-selected='true'] { background: var(--raised); color: var(--ink); box-shadow: 0 0 0 2px var(--accent); }
  .code { display: block; width: min(100%, 360px); margin: 0 auto; image-rendering: pixelated; border-radius: 12px; box-shadow: 0 0 0 1px var(--line); }
  .note { color: var(--muted); text-align: center; }
  .warn { font-size: .9rem; }
  .bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
  .cam { position: relative; aspect-ratio: 1; width: min(100%, 380px); margin: 0 auto 14px; border-radius: 18px; overflow: hidden; background: #000; }
  video { width: 100%; height: 100%; object-fit: cover; }
  .frame { position: absolute; inset: 18%; border: 4px solid var(--sun); border-radius: 18px; box-shadow: 0 0 0 999px rgb(0 0 0 / .35); }
  label.btn { display: flex; width: fit-content; margin: 0 auto; }
</style>
