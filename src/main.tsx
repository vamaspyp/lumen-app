import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './worldclass.css'
import './premium-field.css'
import './premium-field-final.css'
import './premium-runtime.css'
import PremiumRuntime from './PremiumRuntime'
import ExperienceAtlasRoute from './ExperienceAtlasRoute'

const certificationAtlas = window.location.pathname === '/experience-atlas' || window.location.pathname === '/experience-atlas/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {certificationAtlas ? <ExperienceAtlasRoute /> : <PremiumRuntime />}
  </StrictMode>,
)
