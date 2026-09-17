import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/styles.css'
import './app/a63-continuity.css'
import './app/accessibility.css'
import App from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
