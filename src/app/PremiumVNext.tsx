import {useState} from 'react'
import './premium-vnext.css'

type Scene='inicio'|'momento'|'mapa'|'faro'|'constelacion'|'vivir'|'retorno'|'santuario'|'territorio'|'impacto'

const art={
 hero:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=90',
 moment:'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=90',
 map:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=90',
 faro:'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=90',
 family:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=90',
 calm:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd4297?auto=format&fit=crop&w=1200&q=90'
}
const nav=[['⌂','Inicio','inicio'],['◇','Explorar','territorio'],['♡','Mi Vida','mapa'],['♧','Comunidad','impacto'],['▤','Biblioteca','constelacion']] as const
const resources=[
 ['PRÁCTICA','Transición consciente trabajo-hogar','10 min · Bienestar · Presencia',art.calm],
 ['LECTURA','Lo que de verdad importa','12 min · Reflexión · Sentido',art.moment],
 ['AUDIO','Volver al presente','8 min · Atención · Mindfulness',art.map],
 ['EXPERIENCIA','Ritual de conexión con tus hijos','20 min · Relaciones · Familia',art.family],
] as const
const sanctuary=[
 ['Ritual de conexión con tus hijos','Práctica · 10 min','Me ayudó mucho','♡',art.family],
 ['Volver al presente','Audio · 8 min','Me ayudó','',art.map],
 ['Lo que de verdad importa','Lectura · 12 min','Me ayudó','',art.moment],
 ['Caminar al amanecer','Experiencia · 15 min','Me ayudó mucho','',art.calm],
] as const
const areas=['Bienestar físico y mental','Trabajo y propósito','Relaciones','Familia y hogar','Desarrollo personal','Creatividad','Comunidad y servicio','Entorno y naturaleza','Finanzas y recursos']

function Chrome({scene,go,children,back}:{scene:Scene,go:(s:Scene)=>void,children:React.ReactNode,back?:()=>void}){
 return <main className="gm-stage"><div className="gm-phone"><header className="gm-top">{back?<button aria-label="Volver" onClick={back}>‹</button>:<span/>}<b>LUMEN</b><button aria-label="Cuenta">◎</button></header><div className="gm-content">{children}</div><nav className="gm-nav">{nav.map(([i,l,s])=><button key={l} className={scene===s?'on':''} onClick={()=>go(s as Scene)}><i>{i}</i><small>{l}</small></button>)}</nav></div></main>
}
export default function PremiumVNext(){
 const [scene,setScene]=useState<Scene>('inicio')
 const [moment,setMoment]=useState('Estoy agotado. Siento que estoy dando mucho y me cuesta encontrar un balance... Quiero estar más presente con mi familia, pero también necesito recuperar mi energía.')
 const [feedback,setFeedback]=useState('Me ayudó')
 const [filter,setFilter]=useState('Todas')
 const go=(s:Scene)=>setScene(s)
 let body:React.ReactNode
 if(scene==='inicio') body=<section className="gm-screen gm-home" style={{backgroundImage:`linear-gradient(0deg,rgba(15,22,18,.62),rgba(15,22,18,.05)),url(${art.hero})`}}><div className="gm-home-copy"><h1>Una vida más tuya.</h1><p>Recursos, prácticas y personas para volver al cuerpo, habitar el presente y crear una vida más consciente.</p><button className="gm-entry" onClick={()=>go('momento')}>Cuéntame en qué momento estás... <i>→</i></button><div className="gm-pills">{['Me siento estresado','Necesito claridad','Quiero avanzar en algo','Solo quiero explorar'].map((x,i)=><button key={x} onClick={()=>go(i===3?'territorio':'momento')}>{x}</button>)}</div></div></section>
 else if(scene==='momento') body=<section className="gm-screen gm-moment" style={{backgroundImage:`linear-gradient(0deg,rgba(20,24,20,.52),rgba(20,24,20,.06)),url(${art.moment})`}}><div className="gm-overlay"><small>Tu Momento</small><h1>¿Qué estás viviendo hoy?</h1><p>Escribe con libertad. No hay respuestas correctas. LUMEN te escucha.</p><textarea value={moment} onChange={e=>setMoment(e.target.value)}/><div className="gm-tools"><span>◉</span><span>▧</span><span>▣</span><button onClick={()=>go('mapa')}>→</button></div></div></section>
 else if(scene==='mapa') body=<section className="gm-screen gm-map" style={{backgroundImage:`linear-gradient(0deg,rgba(20,29,24,.38),rgba(20,29,24,.08)),url(${art.map})`}}><h1>Mi Mapa Vivo</h1><p>Una comprensión de tu vida que evoluciona contigo.</p><div className="gm-tabs"><b>Vista general</b><span>Dirección</span><span>Potencial</span><span>Realización</span><span>Condiciones</span></div><div className="gm-lenses"><article><i>♧</i><b>Dirección</b><small>Lo que importa</small></article><article><i>❧</i><b>Potencial</b><small>Lo que puedes desplegar</small></article><article><i>≈</i><b>Condiciones</b><small>Lo que habilita o restringe</small></article><article><i>☼</i><b>Realización</b><small>Lo que vives hoy</small></article></div><div className="gm-caption">Esta es una visión en construcción. Se va enriqueciendo con cada momento.</div><button className="gm-primary" onClick={()=>go('faro')}>Ver mi Faro</button></section>
 else if(scene==='faro') body=<section className="gm-screen gm-faro" style={{backgroundImage:`linear-gradient(0deg,rgba(14,21,18,.68),rgba(14,21,18,.06)),url(${art.faro})`}}><div className="gm-faro-main"><h1>Mi Faro</h1><p>Tu orientación actual.</p><blockquote>Estar presente con mi familia, viviendo un trabajo significativo, cuidando mi bienestar.</blockquote><button>Editar mi Faro</button></div><div className="gm-next"><b>Próximos pasos sugeridos</b><button>Explorar más sobre este Faro <i>›</i></button><button>Ver cómo se conecta con tu vida actual <i>›</i></button><button onClick={()=>go('constelacion')}>Abrir una constelación para avanzar <i>›</i></button></div></section>
 else if(scene==='constelacion') body=<section className="gm-screen gm-list"><header style={{backgroundImage:`linear-gradient(0deg,rgba(14,21,18,.72),rgba(14,21,18,.08)),url(${art.calm})`}}><h1>Tu Constelación</h1><p>Una combinación de posibilidades para acompañarte en este momento, hacia lo que importa para vos.</p></header><div className="gm-filters">{['Todas','Prácticas','Lecturas','Audios','Experiencias'].map(x=><button className={filter===x?'on':''} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div><div className="gm-resources">{resources.filter(r=>filter==='Todas'||r[0]===filter.slice(0,-1).toUpperCase()).map((r,i)=><button key={r[1]} onClick={()=>i===3&&go('vivir')}><img src={r[3]}/><span><small>{r[0]}</small><b>{r[1]}</b><em>{r[2]}</em></span><i>›</i></button>)}</div></section>
 else if(scene==='vivir') body=<section className="gm-screen gm-live"><div className="gm-video" style={{backgroundImage:`url(${art.family})`}}><button>▶</button><span>00:00 ━━━━━ 10:00</span></div><div className="gm-live-copy"><small>PRÁCTICA GUIADA</small><h1>Ritual de conexión con tus hijos</h1><p>Una práctica simple para estar realmente presente, incluso en días agitados.</p><div className="gm-tags"><span>Familia</span><span>Presencia</span><span>Vínculos</span></div><div className="gm-cultivate"><b>Qué vas a cultivar</b><span>Más presencia</span><span>Conexión real</span><span>Menos piloto automático</span></div><button className="gm-primary" onClick={()=>go('retorno')}>Marcar como realizada</button></div></section>
 else if(scene==='retorno') body=<section className="gm-screen gm-return"><h1>¿Cómo fue?</h1><p>Tu experiencia nos ayuda a acompañarte mejor.</p><div className="gm-faces">{[['◉','Me ayudó mucho'],['◡','Me ayudó'],['•','Algo'],['⌢','No mucho'],['×','No me sirvió']].map(([f,l])=><button key={l} className={feedback===l?'on':''} onClick={()=>setFeedback(l)}><i>{f}</i><small>{l}</small></button>)}</div><b className="gm-label">Cuéntame más sobre tu experiencia...</b><textarea placeholder="¿Qué fue lo más valioso? ¿Qué fue difícil? ¿En qué te gustaría profundizar?"/><div className="gm-note">Esto también enriquece tu Mapa Vivo y ayuda a otras personas.</div><button className="gm-primary" onClick={()=>go('santuario')}>Guardar en mi Santuario</button></section>
 else if(scene==='santuario') body=<section className="gm-screen gm-list gm-sanctuary"><header style={{backgroundImage:`linear-gradient(0deg,rgba(14,21,18,.64),rgba(14,21,18,.08)),url(${art.moment})`}}><h1>Mi Santuario</h1><p>Tu espacio personal de lo significativo y propio.</p></header><div className="gm-san-tabs"><b>Recursos</b><span>Experiencias</span><span>Reflexiones</span><span>Notas</span></div><div className="gm-resources">{sanctuary.map(r=><article key={r[0]}><img src={r[4]}/><span><b>{r[0]}</b><em>{r[1]}</em><small>{r[2]}</small></span><i>{r[3]}</i></article>)}</div></section>
 else if(scene==='territorio') body=<section className="gm-screen gm-territory" style={{backgroundImage:`linear-gradient(0deg,rgba(14,21,18,.62),rgba(14,21,18,.14)),url(${art.map})`}}><h1>Explorar el Territorio</h1><p>Áreas de la vida para inspirarte y orientar tu camino.</p><div className="gm-areas">{areas.map((a,i)=><button key={a} style={{backgroundImage:`linear-gradient(0deg,rgba(15,23,19,.58),rgba(15,23,19,.04)),url(${[art.calm,art.faro,art.family,art.hero,art.moment,art.map][i%6]})`}}>{a}</button>)}</div></section>
 else body=<section className="gm-screen gm-impact" style={{backgroundImage:`linear-gradient(0deg,rgba(13,20,17,.72),rgba(13,20,17,.18)),url(${art.family})`}}><div><h1>Impacto y Aprendizaje</h1><p>Tu experiencia contribuye. Juntos hacemos que LUMEN evolucione para servir mejor a todos.</p>{[['Vidas reales','Personas que comparten sus experiencias.'],['Aprendizaje colectivo','Identificamos patrones que realmente ayudan.'],['Mejores acompañamientos','LUMEN evoluciona para servir mejor.']].map(x=><article key={x[0]}><b>{x[0]}</b><span>{x[1]}</span></article>)}<blockquote>“Tu camino no solo transforma tu vida. También ilumina el camino de otros.”</blockquote></div></section>
 return <Chrome scene={scene} go={go} back={scene==='momento'?()=>go('inicio'):undefined}>{body}</Chrome>
}
