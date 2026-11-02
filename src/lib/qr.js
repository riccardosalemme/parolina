// Testo <-> QR code.
// Il QR contiene un indirizzo dell'app:  <url>#t=<markdown compresso zlib, base64url>
// cosi' basta inquadrarlo con la fotocamera del telefono per riaprire il testo.

import qrcode from 'qrcode-generator'

const toB64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
const through = (bytes, stream) => new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()

// 'deflate' di CompressionStream e' il formato zlib (lo stesso di zlib.compress in Python)
export async function pack(md) {
  return toB64(new Uint8Array(await through(new TextEncoder().encode(md), new CompressionStream('deflate'))))
}

export async function unpack(data) {
  return new TextDecoder().decode(await through(fromB64(data), new DecompressionStream('deflate')))
}

export const appUrl = () => location.origin + location.pathname

export const link = async md => `${appUrl()}#t=${await pack(md)}`

// Il testo contenuto in un link (o in un QR letto), altrimenti null
export function fromLink(text) {
  const m = text?.match(/#t=([\w-]+)/)
  return m ? unpack(m[1]) : null
}

// Immagine PNG (data url) del QR; errore se il testo e' troppo lungo
export function qrImage(text, cell = 8, margin = 4) {
  const qr = qrcode(0, 'L')
  qr.addData(text)
  qr.make()
  const n = qr.getModuleCount(), size = (n + 2 * margin) * cell
  const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size })
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000'
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell)
  return { url: canvas.toDataURL('image/png'), modules: n }
}

// Legge un QR da un video, un'immagine o un canvas
let detector
export async function scan(source) {
  if (detector === undefined)
    detector = 'BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats()).includes('qr_code')
      ? new BarcodeDetector({ formats: ['qr_code'] }) : null
  if (detector) return (await detector.detect(source))[0]?.rawValue ?? null

  const { default: jsQR } = await import('jsqr')
  const w = source.videoWidth || source.naturalWidth || source.width
  const h = source.videoHeight || source.naturalHeight || source.height
  if (!w || !h) return null
  const ctx = Object.assign(document.createElement('canvas'), { width: w, height: h }).getContext('2d')
  ctx.drawImage(source, 0, 0, w, h)
  return jsQR(ctx.getImageData(0, 0, w, h).data, w, h)?.data ?? null
}
