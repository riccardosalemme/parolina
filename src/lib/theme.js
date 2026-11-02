// Tema chiaro / scuro / automatico, condiviso da homepage e app.
// E' una stringa semplice nel localStorage, letta anche dallo script in <head> (niente lampo di colore).

const KEY = 'parolina:theme'
const root = document.documentElement

export const getTheme = () => { try { return localStorage.getItem(KEY) || 'auto' } catch { return 'auto' } }

export function setTheme(t) {
  try { localStorage.setItem(KEY, t) } catch { /* storage non disponibile */ }
  if (t === 'auto') delete root.dataset.theme
  else root.dataset.theme = t
}

export const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
