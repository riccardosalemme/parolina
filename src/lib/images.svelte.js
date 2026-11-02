// Immagini personali usate come simboli, salvate nel localStorage.
//
// Nel testo:  [nonna](symbol:img-1k3x9f2a)
// Nei file .md scaricati le immagini viaggiano in fondo, come definizioni di link markdown
// (invisibili in qualsiasi visualizzatore):
//   [img-1k3x9f2a]: data:image/webp;base64,....

import { read, write } from './storage.js'
export { isImage } from './symbols.js'

export const SIZE = 300                        // lato in pixel, come i simboli ARASAAC
export const images = $state(read('images', {}))   // id -> { name, data, added }

const DEF = /^\[(img-[a-z0-9]+)\]:\s*(data:image\/[\w+]+;base64,[\w+/=]+)\s*$/gm

// id dal contenuto: la stessa immagine importata due volte ha lo stesso id (anche su un altro dispositivo)
function hash(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

const save = () => write('images', images)

// Aggiunge le immagini { id: { name, data } }; false se la memoria e' piena
export function addImages(list) {
  const before = { ...images }
  for (const [id, img] of Object.entries(list)) images[id] ??= { name: img.name ?? '', data: img.data, added: img.added ?? Date.now() }
  if (save()) return true
  for (const id of Object.keys(images)) if (!(id in before)) delete images[id]
  return false
}

// Nuova immagine (data url); restituisce l'id, o null se la memoria e' piena
export function addImage(data, name) {
  const id = 'img-' + hash(data)
  return addImages({ [id]: { name, data } }) ? id : null
}

export function removeImage(id) {
  delete images[id]
  save()
}

// Immagini personali il cui nome corrisponde alla parola
export const imagesFor = word => Object.keys(images).filter(id => images[id].name.toLowerCase() === word.toLowerCase())

export const recent = () => Object.keys(images).sort((a, b) => images[b].added - images[a].added)

const used = md => [...new Set(md.match(/img-[a-z0-9]+/g) ?? [])].filter(id => images[id])

// Il testo con in fondo le immagini che usa (per scaricarlo come .md)
export const withImages = md => {
  const ids = used(md)
  return ids.length ? md.replace(/\n*$/, '\n\n') + ids.map(id => `[${id}]: ${images[id].data}`).join('\n') + '\n' : md
}

export const hasDefinitions = md => md.includes(']: data:image/')

// Salva le immagini che il testo porta con se' e le toglie dal testo
export function absorb(md) {
  const found = {}
  const clean = md.replace(DEF, (_, id, data) => { found[id] = { data }; return '' }).replace(/\s+$/, '')
  for (const id in found) found[id].name = clean.match(new RegExp(`\\[([^\\]]+)\\]\\(symbol:${id}\\)`))?.[1] ?? ''
  addImages(found)
  return clean
}

// Ritaglio: la porzione visibile dell'immagine -> quadrato SIZE x SIZE, sfondo bianco
export function render(img, x, y, scale, frame) {
  const k = SIZE / frame
  const canvas = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE })
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, x * k, y * k, img.naturalWidth * scale * k, img.naturalHeight * scale * k)
  const webp = canvas.toDataURL('image/webp', 0.85)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.88)   // Safari non crea webp
}
