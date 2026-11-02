// Service worker: Parolina funziona anche senza rete.
//  - pagine, codice e vocabolario: dalla rete se c'e', altrimenti dalla copia salvata
//  - simboli: dalla copia salvata se c'e' (non cambiano mai)

const CACHE = 'parolina-v1'
const SHELL = ['./', 'app/', 'data/index.json', 'data/forme.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))))
  self.clients.claim()
})

const save = (req, res) => {
  if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()))
  return res
}

self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET') return

  if (url.hostname === 'static.arasaac.org' || url.pathname.includes('/symbols/')) {
    e.respondWith(caches.match(req.url).then(hit => hit ?? fetch(req.url, { mode: 'cors' }).then(res => save(req.url, res)).catch(() => fetch(req))))
  } else if (url.origin === location.origin) {
    const page = req.mode === 'navigate' && (url.pathname.includes('/app') ? 'app/' : './')
    e.respondWith(fetch(req).then(res => save(req, res))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit ?? (page && caches.match(page)))))
  }
})
