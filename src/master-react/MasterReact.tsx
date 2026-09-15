import {useState} from 'react'
import './MasterReact.css'

type Scene='home'|'sanctuary'|'practice'|'resource'|'integrate'

const Icon=({name}:{name:string})=>{
  const common={width:22,height:22,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round' as const,strokeLinejoin:'round' as const}
  if(name==='home')return <svg {...common}><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-7h6v7"/></svg>
  if(name==='chat')return <svg {...common}><path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.2A8 8 0 1 1 21 12Z"/></svg>
  if(name==='sanct')return <svg {...common}><path d="M12 3c4 3 6 6 6 10a6 6 0 1 1-12 0c0-4 2-7 6-10Z"/><path d="M9 14c1-2 2-3 3-4 1 1 2 2 3 4"/></svg>
  if(name==='book')return <svg {...common}><path d="M4 5h6a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 2Z"/><path d="M20 5h-6a3 3 0 0 0-3 3v11h6a3 3 0 0 1 3 2Z"/></svg>
  if(name==='compass')return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-5 2 2-5 5-2Z"/></svg>
  if(name==='leaf')return <svg {...common}><path d="M20 4C12 4 6 7 5 14c4 1 9 0 12-4"/><path d="M5 20c2-6 6-10 12-13"/></svg>
  if(name==='star')return <svg {...common}><path d="m12 3 2.7 5.5L21 9.4l-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.4l6.3-.9Z"/></svg>
  if(name==='pause')return <svg {...common}><path d="M9 7v10M15 7v10"/></svg>
  if(name==='heart')return <svg {...common}><path d="M20.8 5.8c-2.4-2.4-6.2-1.2-8.8 1.6C9.4 4.6 5.6 3.4 3.2 5.8.7 8.3 2 12 4.5 14.4L12 21l7.5-6.6C22 12 23.3 8.3 20.8 5.8Z"/></svg>
  if(name==='mic')return <svg {...common}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>
  if(name==='spark')return <svg {...common}><path d="M12 2c0 5-2 7-7 7 5 0 7 2 7 7 0-5 2-7 7-7-5 0-7-2-7-7Z"/></svg>
  return <span/>
}

const Status=()=> <div className="mr-status"><b>9:41</b><span>▮▮ ◉ ▰</span></div>

function Home({go}:{go:(s:Scene)=>void}){
  return <div className="mr-screen mr-home">
    <Status/><div className="mr-home-bg"/><div className="mr-home-arch"/><div className="mr-wordmark">LUMEN</div><button className="mr-sun">☼</button>
    <aside className="mr-side-nav"><button className="active"><Icon name="home"/><span>Hoy</span></button><button onClick={()=>go('practice')}><Icon name="chat"/><span>Conversar</span></button><button onClick={()=>go('sanctuary')}><Icon name="sanct"/><span>Santuario</span></button><button onClick={()=>go('resource')}><Icon name="book"/><span>Recursos</span></button><button onClick={()=>go('resource')}><Icon name="compass"/><span>Explorar</span></button></aside>
    <section className="mr-welcome"><h1>Buenos días,<br/>LUMI</h1><p>Qué bonito tenerte aquí.<br/>Un nuevo día también<br/>puede ser un nuevo comienzo.</p></section>
    <button className="mr-lumi-bar" onClick={()=>go('practice')}><Icon name="leaf"/><span>Hablemos, ¿qué está en tu mente hoy?</span><Icon name="mic"/></button>
    <div className="mr-experiences-head"><span>Experiencias para ti</span><small>Ver todas ›</small></div>
    <div className="mr-experience-cards"><button onClick={()=>go('practice')}><div className="mr-thumb mr-t1"/><b>Un momento<br/>de calma</b><small>3 min</small></button><button onClick={()=>go('resource')}><div className="mr-thumb mr-t2"/><b>Claridad<br/>para decidir</b><small>7 min</small></button><button onClick={()=>go('resource')}><div className="mr-thumb mr-t3"/><b>Confianza<br/>en el camino</b><small>5 min</small></button></div>
  </div>
}

function Sanctuary({go}:{go:(s:Scene)=>void}){
 const nodes=[['Claridad','5 momentos','49%','22%','cool'],['Aprendizaje','8 momentos','16%','39%','warm'],['Gratitud','12 momentos','78%','39%','warm'],['Bienestar','6 momentos','19%','63%','cool'],['Relaciones','9 momentos','75%','68%','warm']]
 return <div className="mr-screen mr-sanctuary"><Status/><button className="mr-back" onClick={()=>go('home')}>‹</button><header className="mr-center-title"><h1>Tu constelación</h1><p>Tu vida también deja luz.</p></header><div className="mr-tabs"><button className="selected">Todo</button><button>Recuerdos</button><button>Aprendizajes</button><button>Relaciones</button></div><div className="mr-constellation"><div className="mr-const-bg"/><svg className="mr-orbits" viewBox="0 0 300 380"><ellipse cx="150" cy="175" rx="105" ry="130"/><ellipse cx="150" cy="175" rx="72" ry="98"/><path d="M52 125 150 175 245 122M52 125l26 142 72-92 84 112"/></svg><div className="mr-central-orb"><Icon name="leaf"/><b>Más presente</b><small>12 Jun 2025</small></div>{nodes.map(([a,b,l,t,c])=><div className={'mr-node '+c} style={{left:l,top:t}} key={a}><span/><b>{a}</b><small>{b}</small></div>)}</div><p className="mr-sanct-quote">No estás solo en este camino.<br/>Cada experiencia también deja luz.</p><nav className="mr-bottom-nav"><button><Icon name="star"/><span>Tu constelación</span></button><button onClick={()=>go('resource')}><Icon name="compass"/><span>Explorar</span></button><button onClick={()=>go('integrate')}><span className="mr-plus">+</span><span>Crear</span></button><button><Icon name="sanct"/><span>Rituales</span></button><button><span className="mr-person">♙</span><span>Tú</span></button></nav></div>
}

function Practice({go}:{go:(s:Scene)=>void}){const[step,setStep]=useState(1);return <div className="mr-screen mr-practice"><Status/><button className="mr-back" onClick={()=>go('home')}>‹</button><span className="mr-practice-title">Práctica guiada</span><button className="mr-exit" onClick={()=>go('home')}>Salir</button><div className="mr-progress">{[1,2,3,4,5].map(n=><span key={n} className={n<=step?'on':''}/>)}</div><small className="mr-progress-label">{step} de 5 · Llegar</small><h1>Hagamos una pausa juntos</h1><p className="mr-sub">Unos minutos para volver a ti.</p><div className="mr-breath-orb"><div className="mr-wave"/></div><div className="mr-breath-copy"><h2>Respira</h2><p>Inhala lentamente</p></div><button className="mr-pause"><Icon name="pause"/></button><button className="mr-next" onClick={()=>step<5?setStep(step+1):go('integrate')}>Siguiente <span>→</span></button></div>}

function Resource({go}:{go:(s:Scene)=>void}){return <div className="mr-screen mr-resource"><Status/><button className="mr-back" onClick={()=>go('home')}>‹</button><button className="mr-heart"><Icon name="heart"/></button><button className="mr-share">⇧</button><div className="mr-resource-hero"/><div className="mr-resource-body"><span className="mr-badge">MEDITACIÓN · 7 MIN</span><h1>Calma en lo cotidiano</h1><p className="mr-subtitle">Volver al presente, una respiración a la vez.</p><div className="mr-resource-meta"><span>◷ 7 min</span><span>♧ Audio</span><span>▥ Nivel inicial</span></div><p>Una práctica suave para recordar que la calma también habita en los momentos simples. A través de la respiración, volvemos al cuerpo, al aquí y ahora, y encontramos un espacio de claridad en medio del día.</p><blockquote><Icon name="leaf"/><span>“La calma no se encuentra,<br/>se recuerda.”</span></blockquote></div><button className="mr-start" onClick={()=>go('practice')}>▶ &nbsp; Comenzar práctica</button></div>}

function Integrate({go}:{go:(s:Scene)=>void}){const[note,setNote]=useState('');return <div className="mr-screen mr-integrate"><Status/><button className="mr-back" onClick={()=>go('home')}>‹</button><button className="mr-save-top" onClick={()=>go('sanctuary')}>Guardar</button><header className="mr-integrate-head"><h1>Integrar esta experiencia</h1><p>Tu vivencia también deja huella.</p></header><section className="mr-note-card"><div className="mr-note-title"><h2>¿Qué quieres recordar<br/>de este momento?</h2><Icon name="spark"/></div><textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="Escribe aquí lo que te gustaría guardar... Puede ser una idea, una emoción, una frase o un aprendizaje."/><small>{note.length}/500</small></section><p className="mr-also">También puedes guardar:</p><div className="mr-save-chips"><button>❝ <span>Una frase clave</span></button><button><Icon name="heart"/><span>Cómo te sientes</span></button><button><Icon name="leaf"/><span>Un aprendizaje</span></button><button>◎ <span>Un compromiso</span></button></div><div className="mr-seed-card"><Icon name="leaf"/><span>Cada nota es una semilla<br/>de tu camino.</span></div></div>}

export default function MasterReact(){const[scene,setScene]=useState<Scene>('home');return <div className="mr-app"><div className="mr-phone">{scene==='home'&&<Home go={setScene}/>} {scene==='sanctuary'&&<Sanctuary go={setScene}/>} {scene==='practice'&&<Practice go={setScene}/>} {scene==='resource'&&<Resource go={setScene}/>} {scene==='integrate'&&<Integrate go={setScene}/>}</div></div>}
