// Pareri e segnalazioni: un solo modulo Tally, aperto da tre punti con parametri diversi.
//   source  sito | app | simbolo     da dove arriva la segnalazione
//   word    la parola (solo da "simbolo")
//   symbol  il simbolo usato ora: id ARASAAC, img-... oppure vuoto (solo da "simbolo")
// Al modulo arrivano solo questi valori, mai il testo dell'utente.

export const FEEDBACK = import.meta.env.VITE_FEEDBACK_URL ?? ''

export function feedbackUrl(source, word = '', symbol = '') {
  const url = new URL(FEEDBACK)
  url.searchParams.set('source', source)
  if (word) url.searchParams.set('word', word)
  if (symbol) url.searchParams.set('symbol', symbol)
  return url.href
}
