import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/styles.css'
import './app/a63-continuity.css'
import './app/accessibility.css'
import './app/premium-v4.css'
import './app/premium-v4-ci.css'
import './app/premium-v4-feedback.css'
import './app/a63-source-consistency.css'
import './app/premium-source.css'
import './app/premium-field-v5.css'
import './app/chatgpt-parity.css'
import App from './app/App'
import { LumiPresence } from './app/LumiPresence'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <LumiPresence />
  </StrictMode>,
)
