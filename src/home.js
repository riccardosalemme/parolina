// Homepage: tasto del tema chiaro / scuro e link ai pareri

import { setTheme, isDark } from './lib/theme.js'
import { FEEDBACK, feedbackUrl } from './lib/feedback.js'

// link al modulo dei pareri; senza indirizzo configurato spariscono
if (FEEDBACK) for (const a of document.querySelectorAll('[data-feedback]')) Object.assign(a, { href: feedbackUrl('sito'), target: '_blank', rel: 'noopener' })
else for (const el of document.querySelectorAll('[data-feedback], [data-feedback-box]')) el.remove()

const root = document.documentElement
const sync = () => { root.toggleAttribute('data-dark', isDark()) }

document.getElementById('theme').addEventListener('click', () => {
  setTheme(isDark() ? 'light' : 'dark')
  sync()
})
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sync)
sync()
