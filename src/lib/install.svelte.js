// installare l'app (PWA): Chrome, Edge e Samsung Internet danno il proprio prompt;
// Firefox e iOS no, quindi mostriamo come fare dal menu del browser
const ua = navigator.userAgent
export const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
export const firefox = /Firefox|FxiOS/.test(ua)
export const android = /Android/.test(ua)

const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
export const install = $state({ prompt: null, done: standalone })

addEventListener('beforeinstallprompt', e => { e.preventDefault(); install.prompt = e })
addEventListener('appinstalled', () => { install.prompt = null; install.done = true })

// true se il browser ha mostrato il suo prompt, false se servono le istruzioni
export async function askInstall() {
  const p = install.prompt
  if (!p) return false
  install.prompt = null   // il prompt si puo' usare una volta sola
  p.prompt()
  if ((await p.userChoice).outcome === 'accepted') install.done = true
  return true
}
