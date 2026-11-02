// localStorage con prefisso. write() restituisce false se la memoria del browser e' piena.

const PREFIX = 'parolina:'

// dati salvati quando l'app si chiamava caa-facile
try {
  for (const k of Object.keys(localStorage))
    if (k.startsWith('caa-facile:')) {
      localStorage.setItem(PREFIX + k.slice(11), localStorage.getItem(k))
      localStorage.removeItem(k)
    }
} catch { /* storage non disponibile */ }

export const read = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(PREFIX + k)) ?? fallback } catch { return fallback }
}

export const write = (k, v) => {
  try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true } catch { return false }
}
