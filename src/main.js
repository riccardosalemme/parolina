import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { ROOT } from './lib/symbols.js'

mount(App, { target: document.getElementById('app') })

if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register(ROOT + 'sw.js', { scope: ROOT })
