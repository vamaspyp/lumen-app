import type { SourceItem } from '../greenfield/application/embryo'
import { premiumFamily, premiumFamilyLabel } from './premium-source'

const labels:Record<string,string>={practice:'Práctica',reading:'Lectura',reflection:'Reflexión',question:'Pregunta',tool:'Herramienta',conversation:'Conversación',human_action:'Acción en la vida',professional_support:'Apoyo profesional',institutional_service:'Servicio',external_resource:'Recurso externo',audio:'Audio',video:'Video'}
function sourceLabel(item:SourceItem){return premiumFamily(item)?premiumFamilyLabel(item):labels[item.help_type]||'Una posibilidad'}
export function SourceCard({item,onOpen,reason,primary=false,busy=false,children,onPreview}:{item:SourceItem;onOpen:()=>void;reason?:string;primary?:boolean;busy?:boolean;children?:React.ReactNode;onPreview?:()=>void}){
 return <article className={`gm-context-card ${primary?'gm-for-now':''}`}>
  {primary&&<p className="gm-for-now-label">Para ahora</p>}
  <button className="gm-source-open" disabled={busy} onClick={onOpen}>
   <span><small>{sourceLabel(item)}{item.duration_minutes?` · ${item.duration_minutes} min`:''}</small><b>{item.title}</b><em>{item.summary}</em>{reason&&<span className="gm-context-reason">{reason}</span>}<small>{item.provider?.name||'Fuente LUMEN'}</small></span><i aria-hidden="true">{primary?'Empezar →':'›'}</i>
  </button>{onPreview&&<button className="gm-source-preview" disabled={busy} onClick={onPreview}>Conocer esta posibilidad</button>}{children}
 </article>
}

