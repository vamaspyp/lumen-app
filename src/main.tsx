import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './worldclass.css'
import App from './App.tsx'
import MasterReact from './master-react/MasterReact'
import './master-scenes.css'
import './master-photographic.css'

const isMasterReact = window.location.pathname === '/master-react' || window.location.pathname === '/master-react/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isMasterReact ? <MasterReact /> : <App />}
  </StrictMode>,
)
