import {useEffect,useState} from 'react'
import { getAuthSnapshot, requestEmailOtp, verifyEmailOtp } from '../greenfield/application/auth'
import { bootstrapPerson } from '../greenfield/application/consent'
import { accompanyMoment, selectHelp, recordOutcome, type OutcomeEffect } from '../greenfield/application/s1'
import { composeMomentConstellation } from '../greenfield/application/moment'
import { createTrajectoryFromMoment, updateTrajectory, getSourceTaxonomy, listSanctuary, saveSanctuary, discoverSource, type SourceItem, type SanctuaryEntry } from '../greenfield/application/embryo'
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
 const [episodeId,setEpisodeId]=useState<string|null>(null)
 const [momentId,setMomentId]=useState<string|null>(null)
 const [capacityKeys,setCapacityKeys]=useState<string[]>([])
 const [liveResources,setLiveResources]=useState<SourceItem[]>([])
 const [chosen,setChosen]=useState<SourceItem|null>(null)
 const [sanctuaryEntries,setSanctuaryEntries]=useState<SanctuaryEntry[]>([])
 const [note,setNote]=useState('')
 const [faro,setFaro]=useState('Estar presente con mi familia, viviendo un trabajo significativo, cuidando mi bienestar.')
 const [trajectoryId,setTrajectoryId]=useState<string|null>(null)
 const [editingFaro,setEditingFaro]=useState(false)
 const [sanctuaryTab,setSanctuaryTab]=useState('Recursos')
 const [playing,setPlaying]=useState(false)
 const visibleSanctuary=sanctuaryEntries.filter(e=>sanctuaryTab==='Notas'?e.entry_kind==='note':sanctuaryTab==='Reflexiones'?e.entry_kind==='reflection':sanctuaryTab==='Recursos'?e.entry_kind==='treasure':Boolean(e.source_help_id))
 const [busy,setBusy]=useState(false)
 const [authenticated,setAuthenticated]=useState(false)
 const [authOpen,setAuthOpen]=useState(false)
 const [email,setEmail]=useState('')
 const [otp,setOtp]=useState('')
 const [otpSent,setOtpSent]=useState(false)
 const [pendingAction,setPendingAction]=useState<null|(()=>Promise<void>)>(null)
 const [error,setError]=useState('')
 useEffect(()=>{void getAuthSnapshot().then(async a=>{if(a.session){setAuthenticated(true);await bootstrapPerson();setSanctuaryEntries(await listSanctuary())}}).catch(()=>undefined)},[])
 const requireAuth=(action:()=>Promise<void>)=>{if(authenticated){void action();return}setPendingAction(()=>action);setAuthOpen(true)}
 const sendOtp=async()=>{setBusy(true);setError('');try{await requestEmailOtp(email);setOtpSent(true)}catch(e){setError(e instanceof Error?e.message:'No pudimos enviar el código')}finally{setBusy(false)}}
 const confirmOtp=async()=>{setBusy(true);setError('');try{const a=await verifyEmailOtp(email,otp);if(!a.session)throw new Error('No se pudo iniciar sesión');await bootstrapPerson();setAuthenticated(true);setAuthOpen(false);setOtpSent(false);setSanctuaryEntries(await listSanctuary());const action=pendingAction;setPendingAction(null);if(action)await action()}catch(e){setError(e instanceof Error?e.message:'Código inválido')}finally{setBusy(false)}}
 const submitMoment=async()=>{if(!authenticated){requireAuth(submitMoment);return}setBusy(true);setError('');try{const s=await accompanyMoment(moment);if(!s.episode_id||!s.moment_id)throw new Error('Momento incompleto');setEpisodeId(s.episode_id);setMomentId(s.moment_id);setCapacityKeys(s.interpretation?.capacity_keys||[]);const constellation=await composeMomentConstellation(s.episode_id,s.interpretation?.capacity_keys||[]);setLiveResources(constellation.items||[]);go('mapa')}catch(e){setError(e instanceof Error?e.message:'No pudimos procesar este momento')}finally{setBusy(false)}}
 const ensureTrajectory=async()=>{if(trajectoryId)return trajectoryId;if(!momentId)return null;const t=await createTrajectoryFromMoment(faro,capacityKeys,momentId);setTrajectoryId(t.trajectory_id);return t.trajectory_id}
 const saveFaro=async()=>{setBusy(true);try{const id=await ensureTrajectory();if(id)await updateTrajectory(id,faro,'active');setEditingFaro(false)}finally{setBusy(false)}}
 const openConstellation=async()=>{await ensureTrajectory();go('constelacion')}
 const chooseHelp=async(item:SourceItem)=>{setChosen(item);if(episodeId)await selectHelp(episodeId,item.help_id,'selected');go('vivir')}
 const finish=()=>go('retorno')
 const saveReturn=async()=>{setBusy(true);try{if(episodeId){const effect:OutcomeEffect=feedback==='Me ayudó mucho'||feedback==='Me ayudó'?'helped':feedback==='No mucho'||feedback==='No me sirvió'?'not_helped':'unsure';await recordOutcome(episodeId,effect)}const title=chosen?.title||'Ritual de conexión con tus hijos';await saveSanctuary('reflection',title,note||feedback,chosen?.help_id||null);setSanctuaryEntries(await listSanctuary());go('santuario')}catch(e){setError(e instanceof Error?e.message:'No pudimos guardar el retorno')}finally{setBusy(false)}}
 const exploreArea=async(label:string)=>{setBusy(true);try{const taxonomy=await getSourceTaxonomy();const direct:Record<string,string>={'Bienestar físico y mental':'wellbeing','Trabajo y propósito':'work','Relaciones':'relationships','Familia y hogar':'family_care','Desarrollo personal':'learning_growth','Finanzas y recursos':'economy'};const key=direct[label]||taxonomy.areas.find(a=>a.label===label)?.key||null;setLiveResources(await discoverSource(key,null,null,'es-AR',40));go('constelacion')}finally{setBusy(false)}}
 const go=(s:Scene)=>setScene(s)
 let body:React.ReactNode
 if(scene==='inicio') body=<section className="gm-screen gm-home" style={{backgroundImage:`linear-gradient(0deg,rgba(15,22,18,.62),rgba(15,22,18,.05)),url(${art.hero})`}}><div className="gm-home-copy"><h1>Una vida más tuya.</h1><p>Recursos, prácticas y personas para volver al cuerpo, habitar el presente y crear una vida más consciente.</p><button className="gm-entry" onClick={()=>go('momento')}>Cuéntame en qué momento estás... <i>→</i></button><div className="gm-pills">{['Me siento estresado','Necesito claridad','Quiero avanzar en algo','Solo quiero explorar'].map((x,i)=><button key={x} onClick={()=>go(i===3?'territorio':'momento')}>{x}</button>)}</div></div></section>
 else if(scene==='momento') body=<section className="gm-screen gm-moment" style={{backgroundImage:`linear-gradient(0deg,rgba(20,24,20,.52),rgba(20,24,20,.06)),url(${art.moment})`}}><div className="gm-overlay"><small>Tu Momento</small><h1>¿Qué estás viviendo hoy?</h1><p>Escribe con libertad. No hay respuestas correctas. LUMEN te escucha.</p><textarea value={moment} onChange={e=>setMoment(e.target.value)}/><div className="gm-tools"><span>◉</span><span>▧</span><span>▣</span><button disabled={busy} aria-label="Continuar" onClick={()=>void submitMoment()}>{busy?'…':'→'}</button>{error&&<small className="gm-error">{error}</small>}</div></div></section>
 else if(scene==='mapa') body=<section className="gm-screen gm-map" style={{backgroundImage:`linear-gradient(0deg,rgba(20,29,24,.38),rgba(20,29,24,.08)),url(${art.map})`}}><h1>Mi Mapa Vivo</h1><p>Una comprensión de tu vida que evoluciona contigo.</p><div className="gm-tabs"><b>Vista general</b><span>Dirección</span><span>Potencial</span><span>Realización</span><span>Condiciones</span></div><div className="gm-lenses"><article><i>♧</i><b>Dirección</b><small>Lo que importa</small></article><article><i>❧</i><b>Potencial</b><small>Lo que puedes desplegar</small></article><article><i>≈</i><b>Condiciones</b><small>Lo que habilita o restringe</small></article><article><i>☼</i><b>Realización</b><small>Lo que vives hoy</small></article></div><div className="gm-caption">Esta es una visión en construcción. Se va enriqueciendo con cada momento.</div><button className="gm-primary" onClick={()=>go('faro')}>Ver mi Faro</button></section>
 else if(scene==='faro') body=<section className="gm-screen gm-faro" style={{backgroundImage:`linear-gradient(0deg,rgba(14,21,18,.68),rgba(14,21,18,.06)),url(${art.faro})`}}><div className="gm-faro-main"><h1>Mi Faro</h1><p>Tu orientación actual.</p>{editingFaro?<textarea value={faro} onChange={e=>setFaro(e.target.value)}/>:<blockquote>{faro}</blockquote>}<button onClick={()=>editingFaro?void saveFaro():setEditingFaro(true)}>{editingFaro?'Guardar mi Faro':'Editar mi Faro'}</button></div><div className="gm-next"><b>Próximos pasos sugeridos</b><button onClick={()=>void openConstellation()}>Explorar más sobre este Faro <i>›</i></button><button onClick={()=>go('mapa')}>Ver cómo se conecta con tu vida actual <i>›</i></button><button onClick={()=>void openConstellation()}>Abrir una constelación para avanzar <i>›</i></button></div></section>
 else if(scene==='constelacion') body=<section className="gm-screen gm-list"><header style={{backgroundImage:`linear-gradient(0deg,rgba(14,21,18,.72),rgba(14,21,18,.08)),url(${art.calm})`}}><h1>Tu Constelación</h1><p>Una combinación de posibilidades para acompañarte en este momento, hacia lo que importa para vos.</p></header><div className="gm-filters">{['Todas','Prácticas','Lecturas','Audios','Experiencias'].map(x=><button className={filter===x?'on':''} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div><div className="gm-resources">{(liveResources.length?liveResources.map(r=>({id:r.help_id,type:r.help_type.toUpperCase(),title:r.title,meta:`${r.duration_minutes||''} min · ${(r.areas||[]).join(' · ')}`,img:art.calm,item:r})):resources.map(r=>({id:r[1],type:r[0],title:r[1],meta:r[2],img:r[3],item:null}))).filter(r=>filter==='Todas'||r.type.includes(filter.slice(0,-1).toUpperCase())).map(r=><button key={r.id} onClick={()=>r.item?void chooseHelp(r.item):go('vivir')}><img src={r.img}/><span><small>{r.type}</small><b>{r.title}</b><em>{r.meta}</em></span><i>›</i></button>)}</div></section>
 else if(scene==='vivir') body=<section className="gm-screen gm-live"><div className="gm-video" style={{backgroundImage:`url(${art.family})`}}><button aria-label="Reproducir o pausar" onClick={()=>setPlaying(v=>!v)}>{playing?'Ⅱ':'▶'}</button><span>{playing?'EN CURSO':'00:00'} ━━━━━ 10:00</span></div><div className="gm-live-copy"><small>PRÁCTICA GUIADA</small><h1>{chosen?.title||'Ritual de conexión con tus hijos'}</h1><p>{chosen?.summary||'Una práctica simple para estar realmente presente, incluso en días agitados.'}</p><div className="gm-tags"><span>Familia</span><span>Presencia</span><span>Vínculos</span></div><div className="gm-cultivate"><b>Qué vas a cultivar</b><span>Más presencia</span><span>Conexión real</span><span>Menos piloto automático</span></div><button className="gm-primary" onClick={finish}>Marcar como realizada</button></div></section>
 else if(scene==='retorno') body=<section className="gm-screen gm-return"><h1>¿Cómo fue?</h1><p>Tu experiencia nos ayuda a acompañarte mejor.</p><div className="gm-faces">{[['◉','Me ayudó mucho'],['◡','Me ayudó'],['•','Algo'],['⌢','No mucho'],['×','No me sirvió']].map(([f,l])=><button key={l} aria-label={l} className={feedback===l?'on':''} onClick={()=>setFeedback(l)}><i aria-hidden="true">{f}</i><small aria-hidden="true">{l}</small></button>)}</div><b className="gm-label">Cuéntame más sobre tu experiencia...</b><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="¿Qué fue lo más valioso? ¿Qué fue difícil? ¿En qué te gustaría profundizar?"/><div className="gm-note">Esto también enriquece tu Mapa Vivo y ayuda a otras personas.</div><button className="gm-primary" disabled={busy} onClick={()=>void saveReturn()}>{busy?'Guardando…':'Guardar en mi Santuario'}</button></section>
 else if(scene==='santuario') body=<section className="gm-screen gm-list gm-sanctuary"><header style={{backgroundImage:`linear-gradient(0deg,rgba(14,21,18,.64),rgba(14,21,18,.08)),url(${art.moment})`}}><h1>Mi Santuario</h1><p>Tu espacio personal de lo significativo y propio.</p></header><div className="gm-san-tabs">{['Recursos','Experiencias','Reflexiones','Notas'].map(x=><button key={x} className={sanctuaryTab===x?'on':''} onClick={()=>setSanctuaryTab(x)}>{x}</button>)}</div><div className="gm-resources">{(sanctuaryEntries.length?visibleSanctuary.map(r=>[r.title||'Reflexión','Guardado en tu Santuario',r.content,'♡',art.calm] as const):sanctuary).map(r=><article key={r[0]}><img src={r[4]}/><span><b>{r[0]}</b><em>{r[1]}</em><small>{r[2]}</small></span><i>{r[3]}</i></article>)}</div></section>
 else if(scene==='territorio') body=<section className="gm-screen gm-territory" style={{backgroundImage:`linear-gradient(0deg,rgba(14,21,18,.62),rgba(14,21,18,.14)),url(${art.map})`}}><h1>Explorar el Territorio</h1><p>Áreas de la vida para inspirarte y orientar tu camino.</p><div className="gm-areas">{areas.map((a,i)=><button key={a} onClick={()=>void exploreArea(a)} style={{backgroundImage:`linear-gradient(0deg,rgba(15,23,19,.58),rgba(15,23,19,.04)),url(${[art.calm,art.faro,art.family,art.hero,art.moment,art.map][i%6]})`}}>{a}</button>)}</div></section>
 else body=<section className="gm-screen gm-impact" style={{backgroundImage:`linear-gradient(0deg,rgba(13,20,17,.72),rgba(13,20,17,.18)),url(${art.family})`}}><div><h1>Impacto y Aprendizaje</h1><p>Tu experiencia contribuye. Juntos hacemos que LUMEN evolucione para servir mejor a todos.</p>{[['Vidas reales','Personas que comparten sus experiencias.'],['Aprendizaje colectivo','Identificamos patrones que realmente ayudan.'],['Mejores acompañamientos','LUMEN evoluciona para servir mejor.']].map(x=><article key={x[0]}><b>{x[0]}</b><span>{x[1]}</span></article>)}<blockquote>“Tu camino no solo transforma tu vida. También ilumina el camino de otros.”</blockquote></div></section>
 return <><Chrome scene={scene} go={go} back={scene==='momento'?()=>go('inicio'):undefined}>{body}</Chrome>{authOpen&&<div className="gm-auth" role="dialog" aria-modal="true" aria-label="Entrar a LUMEN"><div><button className="gm-auth-close" aria-label="Cerrar" onClick={()=>setAuthOpen(false)}>×</button><b>LUMEN</b><h2>Entrá para continuar tu camino</h2><p>Tu Momento, Mapa Vivo y Santuario son personales.</p><input aria-label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/>{otpSent&&<input aria-label="Código" inputMode="numeric" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Código recibido"/>}{error&&<small className="gm-error">{error}</small>}<button className="gm-primary" disabled={busy} onClick={()=>void(otpSent?confirmOtp():sendOtp())}>{busy?'…':otpSent?'Entrar':'Enviar código'}</button></div></div>}</>
}
