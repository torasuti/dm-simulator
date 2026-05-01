import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedDefaultDeck } from './utils/seedDeck'

seedDefaultDeck()

function syncAppViewportHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-viewport-height', `${height}px`)
}

syncAppViewportHeight()
window.visualViewport?.addEventListener('resize', syncAppViewportHeight)
window.visualViewport?.addEventListener('scroll', syncAppViewportHeight)
window.addEventListener('resize', syncAppViewportHeight)
window.addEventListener('orientationchange', syncAppViewportHeight)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
