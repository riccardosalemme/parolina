// Scaricare, leggere e copiare testi

import { images, addImages, absorb, withImages } from './images.svelte.js'

export function download(name, content, type = 'text/markdown') {
  const a = document.createElement('a')
  a.href = content.startsWith?.('data:') ? content : URL.createObjectURL(new Blob([content], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const fileName = (title, ext) => (title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() || 'testo') + ext

// Un testo .md con le sue immagini personali in fondo
export const downloadMd = (name, md) => download(fileName(name, '.md'), withImages(md))

// Tutti i testi e tutte le immagini personali in un solo file
export const exportAll = docs => JSON.stringify({
  app: 'parolina',
  docs: docs.map(({ name, title, md, updated }) => ({ name, title, md, updated })),
  images,
}, null, 1)

// Testi [{ md, name }] dai file scelti: .md / .txt uno per file, .json esportato dall'app.
// Le immagini personali che contengono vengono salvate.
export async function readTexts(files) {
  const out = []
  for (const f of files) {
    const text = await f.text()
    if (/\.json$/i.test(f.name)) {
      try {
        const data = JSON.parse(text)
        if (!addImages(data.images ?? {})) throw new Error('memoria piena')
        out.push(...data.docs.map(d => ({ md: d.md, name: d.name ?? '' })))
      } catch { /* file non valido */ }
    } else out.push({ md: absorb(text), name: f.name.replace(/\.\w+$/, '') })
  }
  return out
}

// Copia negli appunti (anche senza https, dove navigator.clipboard non c'e')
export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = Object.assign(document.createElement('textarea'), { value: text })
    document.body.append(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
}
