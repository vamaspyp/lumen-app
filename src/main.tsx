import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './premium-field.css'
import './premium-unified.css'
import AppE63 from './AppE63'
import ExperienceAtlasRoute from './ExperienceAtlasRoute'

const certificationAtlas = window.location.pathname === '/experience-atlas' || window.location.pathname === '/experience-atlas/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {certificationAtlas ? <ExperienceAtlasRoute /> : <AppE63 />}
  </StrictMode>,
)
