// Prompt da copiare e incollare in un modello di intelligenza artificiale

// Per un modello linguistico: scrivere un testo che funzioni in Parolina
export const textPrompt = () => `Scrivi un testo in italiano da usare con Parolina, un'app che mette un simbolo CAA (pittogrammi ARASAAC) sopra ogni parola.

Argomento: [scrivi qui l'argomento]
Per chi è: [es. bambino di 8 anni, ragazzo con autismo, adulto con afasia]
Lunghezza: [es. 8 frasi]

Come scrivere
- Frasi brevi e semplici: soggetto, verbo, complemento. Una frase per riga.
- Parole concrete e comuni, che si possono disegnare. Niente modi di dire, metafore, ironia o doppie negazioni.
- Preferisci il presente e il passato prossimo.
- Ripeti il nome invece di usare pronomi ambigui ("Luca prende la palla. Luca corre.").
- Scrivi i numeri in lettere. Niente emoji né simboli speciali.

Formato: markdown semplice
- Ogni riga diventa una riga di simboli. Una riga vuota separa i paragrafi.
- "# " per il titolo, "## " per i sottotitoli, "- " per gli elenchi.
- **grassetto** e _corsivo_ solo per le parole importanti.
- Ogni parola riceve il suo simbolo da sola. Quando più parole formano un'unica idea, mettile sotto un solo simbolo così:
  [maestra di piano](symbol:maestra)
  dove dopo "symbol:" scrivi UNA parola (verbo all'infinito, nome al singolare) il cui simbolo rappresenta il gruppo.
- Non scrivere numeri dopo "symbol:" e non usare altri link, immagini, tabelle o HTML.

Esempio
# Andiamo al parco
Oggi vado al parco con la mamma.
Al parco gioco sullo scivolo.
Il [signore dei palloncini](symbol:venditore) mi saluta.
Poi mangio un [gelato al cioccolato](symbol:gelato).

Rispondi solo con il testo in markdown, dentro un unico blocco di codice, senza spiegazioni.`

// Per un modello che genera immagini (Gemini "Nano Banana", ChatGPT, ...): un pittogramma per una parola
export const imagePrompt = (words, meaning, sentence) => `Crea un pittogramma per la Comunicazione Aumentativa Alternativa (CAA) che rappresenti: «${words}»${meaning && meaning !== words.toLowerCase() ? ` (cioè «${meaning}»)` : ''}.
${sentence ? `Contesto: compare nella frase «${sentence}».\n` : ''}
Stile, come i pittogrammi ARASAAC:
- disegno semplice e piatto, contorni neri spessi e regolari
- colori pieni e vivaci, senza sfumature, ombre o texture
- un solo soggetto, centrato, che riempie quasi tutta l'immagine
- sfondo bianco pieno, nessun altro elemento
- se è un'azione, una figura stilizzata che la compie in modo chiaro

Formato: quadrato 1:1, almeno 500×500 pixel.
Non inserire testo, lettere, numeri, frecce o cornici.
Deve essere comprensibile a colpo d'occhio anche da un bambino.`
