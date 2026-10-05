import { useEffect, useRef, useState } from 'react'
import { getFaroAgreement, proposeFaroPotentials, validateFaroAgreement, type FaroAgreement as Agreement, type FaroPotential } from '../greenfield/application/faro-agreement'

export type FaroReviewDraft={trajectoryId:string|null;agreement:Agreement|null;items:FaroPotential[];areaKeys:string[];editing:boolean;proposalFor:string}
type Props = {
 momentReview?:boolean;initialDraft?:FaroReviewDraft|null;onDraftChange?:(draft:FaroReviewDraft)=>void;
 trajectoryId: string|null; faro: string; expression: string; areas: Array<{key:string;label:string}>; initialAreaKeys?: string[]
 onConstellation: (a:Agreement)=>void; onChanged?:()=>void; onExplore:()=>void; onPointHelp:()=>void
 draft?:boolean; pending?:boolean; onConfirmDraft?:(items:FaroPotential[],areas:string[],expected:Agreement|null)=>void
}
const keyOf=(i:FaroPotential)=>i.concept_id||i.label.trim().toLocaleLowerCase()
export function FaroAgreement({trajectoryId,faro,expression,areas,initialAreaKeys=[],onConstellation,onChanged,onExplore,onPointHelp,draft=false,onConfirmDraft,pending=false,initialDraft,onDraftChange,momentReview=false}:Props) {
 const [visibleAreas,setVisibleAreas]=useState(initialAreaKeys)
 const initial=useRef({expression,faro,initialAreaKeys,draft:initialDraft})
 const [agreement,setAgreement]=useState<Agreement|null>(initialDraft?.agreement||null)
 const [items,setItems]=useState<FaroPotential[]>(initialDraft?.items||[])
 const [areaKeys,setAreaKeys]=useState<string[]>(initialDraft?.areaKeys||initialAreaKeys)
 const [editing,setEditing]=useState(draft||initialDraft?.editing||false)
 const [working,setBusy]=useState(false)
 const [loaded,setLoaded]=useState(false)
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[own,setOwn]=useState(''),[proposalFor,setProposalFor]=useState(initialDraft?.proposalFor||'')
 useEffect(()=>{
  let current=true
  const load=async()=>{
   try {
    if(initial.current.draft){setLoaded(true);return}
    if(trajectoryId){const a=await getFaroAgreement(trajectoryId);if(current){setAgreement(a);setItems(a.items||[]);setAreaKeys(a.area_keys||[]);setVisibleAreas(a.area_keys||[]);setEditing(draft||a.state!=='validated')}}
    else if(draft&&initial.current.faro.trim()){
     const p=await proposeFaroPotentials(initial.current.expression,initial.current.faro)
     if(current){setItems(p.items.map(i=>({...i,proposed:true})));setMessage(p.message);setProposalFor(initial.current.faro)}
    }
   } catch(e){if(current)setError(e instanceof Error?e.message:'No pude preparar esta lectura.')}
   finally{if(current)setLoaded(true)}
  }
  void load();return()=>{current=false}
 },[trajectoryId,draft])
 useEffect(()=>{if(loaded)onDraftChange?.({trajectoryId,agreement,items,areaKeys,editing,proposalFor})},[loaded,onDraftChange,trajectoryId,agreement,items,areaKeys,editing,proposalFor])
 const busy=working||pending||!loaded
 const propose=async()=>{
  setBusy(true);setError('');const reading=faro
  try {
   const p=await proposeFaroPotentials(agreement?.original_expression||expression||faro,reading)
   setItems(xs=>{const kept=xs.filter(i=>!i.proposed);return [...kept,...p.items.filter(i=>!kept.some(k=>keyOf(k)===keyOf(i))).map(i=>({...i,proposed:true}))].slice(0,24)})
   setProposalFor(reading);setMessage(p.message);setEditing(true)
  }catch(e){setError(e instanceof Error?e.message:'No pude preparar una propuesta.')}
  finally{setBusy(false)}
 }
 const chosen=items.filter(i=>!i.proposed)
 const active=chosen.filter(i=>i.status!=='withdrawn')
 const confirm=async()=>{
  if(draft&&onConfirmDraft){onConfirmDraft(chosen,areaKeys,agreement);return}
  if(!trajectoryId)return
  setBusy(true);setError('')
  try{
   const a=await validateFaroAgreement(trajectoryId,faro,chosen.map(({proposed,reason,source_status,...item})=>{void proposed;void reason;void source_status;return item}),areaKeys,agreement?.version||0)
   const reread=await getFaroAgreement(trajectoryId)
   if(reread.version!==a.version||reread.state!=='validated')throw new Error('No pudimos verificar el acuerdo. Volvé a abrirlo.')
   setAgreement(reread);setItems(reread.items);setEditing(false);setMessage('Quedó confirmado. Podés revisarlo cuando quieras.');onChanged?.()
  }catch(e){setError(e instanceof Error?e.message:'No pudimos confirmar el acuerdo.')}
  finally{setBusy(false)}
 }
 const change=(id:string,field:'label'|'definition'|'contextual_meaning',value:string)=>setItems(xs=>xs.map(x=>x.identity_id===id?{...x,[field]:value,...(field==='label'||field==='definition'?{concept_id:null,origin:'person' as const,...(field==='label'?{definition:''}:{}),source_status:null}:{}),status:'reformulated',proposed:false}:x))
 const choose=(id:string,status:'accepted'|'withdrawn')=>setItems(xs=>xs.map(x=>x.identity_id===id?{...x,status,proposed:false}:x))
 const add=()=>{if(!own.trim())return;setItems(xs=>[...xs,{identity_id:crypto.randomUUID(),concept_id:null,label:own.trim(),definition:'',contextual_meaning:'',origin:'person',status:'accepted'}]);setOwn('');setEditing(true)}
 return <section className="gm-agreement" aria-label={momentReview?"Potenciales de este Momento":"Acuerdo Faro y Potenciales"}>
  {!draft&&agreement?.original_expression&&<details><summary>Lo que dijiste</summary><blockquote>{agreement.original_expression}</blockquote></details>}
  <div className="gm-kicker">Hipótesis revisables</div><h2>{momentReview?"Potenciales que podrías nutrir":"Lo que quiero nutrir"}</h2><p>{momentReview?"Aspectos de vos que podrían ayudarte en lo que contaste. Podés aceptar, cambiar, quitar o agregar; no necesitás crear un Faro.":"Aspectos que podés cultivar para este Faro. Aceptá, ajustá o quitá cada propuesta."}</p>
  {!trajectoryId&&!draft?<p>Primero elegí y conservá tu Faro. Podés recibir una guía puntual sin hacerlo.</p>:!loaded?<p role="status">Leyendo tus palabras…</p>:agreement?.state==='without_memory'?<p>Activá la memoria si querés conservar este acuerdo. La guía puntual sigue disponible.</p>:<>
   {(agreement?.state==='stale'||(agreement&&agreement.faro_text!==faro))&&<p className="gm-notice">Tu Faro cambió. Revisá el acuerdo antes de componer nuevas posibilidades.</p>}
   {agreement?.version?<p className="gm-meta">Acuerdo · versión {agreement.version}</p>:null}
   {editing?<>
    {areas.length>0&&<fieldset className="gm-review-areas"><legend>Áreas que toca · hipótesis revisables</legend><p>Podés quitar, sumar o dejar ninguna.</p><div className="gm-area-choice">{areas.filter(a=>visibleAreas.includes(a.key)).map(a=><label key={a.key}><input disabled={busy} type="checkbox" checked={areaKeys.includes(a.key)} onChange={e=>setAreaKeys(xs=>e.target.checked?[...xs,a.key]:xs.filter(x=>x!==a.key))}/>{a.label}</label>)}</div><details><summary>Revisar otros ámbitos</summary><div className="gm-area-choice">{areas.filter(a=>!visibleAreas.includes(a.key)).map(a=><label key={a.key}><input disabled={busy} type="checkbox" checked={areaKeys.includes(a.key)} onChange={e=>setAreaKeys(xs=>e.target.checked?[...xs,a.key]:xs.filter(k=>k!==a.key))}/>{a.label}</label>)}</div></details></fieldset>}
    {proposalFor&&proposalFor!==faro&&<p className="gm-notice">Cambiaste tu Faro. Podés pedir una nueva lectura; lo que ya aceptaste se conserva.</p>}
    <button disabled={busy||!faro.trim()} className="gm-secondary" onClick={()=>void propose()}>Proponer o regenerar desde mis palabras</button>
    {items.map(i=><article className={`gm-potential ${i.status==='withdrawn'?'is-withdrawn':''}`} key={i.identity_id}>
     {i.status==='withdrawn'?<><p>{i.label} · retirado de esta versión</p><button disabled={busy} onClick={()=>choose(i.identity_id,'accepted')}>Volver a incluir</button></>:<>
      <p className="gm-meta">{i.proposed?'Hipótesis de LUMI · aún sin aceptar':i.status==='reformulated'?'Ajustado por vos':i.origin==='person'?'Lo nombraste vos':'Aceptado por vos'}</p>
      <label>Potencial<input disabled={busy} maxLength={120} value={i.label} onChange={e=>change(i.identity_id,'label',e.target.value)}/></label>
      <label>Qué significa este potencial<textarea disabled={busy} maxLength={1000} value={i.definition} onChange={e=>change(i.identity_id,'definition',e.target.value)}/></label>
      <label>{momentReview?"Para este Momento significa":"Para este Faro significa"}<textarea disabled={busy} maxLength={1000} value={i.contextual_meaning} onChange={e=>change(i.identity_id,'contextual_meaning',e.target.value)} placeholder="Qué significa para vos, en tu vida…"/></label>
      {i.reason&&<details><summary>Por qué te lo propongo</summary><p>{i.reason}</p></details>}
      {i.proposed&&<button disabled={busy} onClick={()=>choose(i.identity_id,'accepted')}>Aceptar {i.label}</button>}
      <button disabled={busy} onClick={()=>choose(i.identity_id,'withdrawn')}>Quitar {i.label}</button>
     </>}
    </article>)}
    <form onSubmit={e=>{e.preventDefault();add()}}><label>Agregar uno con mis palabras<input disabled={busy} maxLength={120} value={own} onChange={e=>setOwn(e.target.value)} placeholder="Algo concreto que quieras nutrir"/></label><button disabled={busy||!own.trim()||items.length>=24}>Agregar potencial</button></form>
    {items.some(i=>i.proposed)&&<p className="gm-meta">Las propuestas sin aceptar quedan fuera del acuerdo.</p>}
    {!momentReview&&<button disabled={busy||active.some(i=>!i.label.trim())||!faro.trim()} className="gm-primary" onClick={()=>void confirm()}>{busy?'Confirmando…':active.length?'Confirmar lo que quiero nutrir':'Seguir sin potenciales'}</button>}
    {agreement?.state==='validated'&&<button className="gm-secondary" disabled={busy} onClick={()=>{setItems(agreement.items);setAreaKeys(agreement.area_keys||[]);setEditing(false)}}>Cancelar cambios</button>}
   </>:<>
    {agreement?.area_keys?.length?<p className="gm-meta">Áreas acordadas: {agreement.area_keys.map(k=>areas.find(a=>a.key===k)?.label||k).join(' · ')}</p>:null}
    <div>{active.map(i=><article className="gm-potential" key={i.identity_id}><h3>{i.label}</h3>{i.contextual_meaning&&<p>{i.contextual_meaning}</p>}{i.definition&&<details><summary>Qué significa</summary><p>{i.definition}</p></details>}</article>)}</div>
    <button className="gm-secondary" onClick={()=>setEditing(true)}>Revisar este acuerdo</button><button className="gm-primary" disabled={busy||agreement?.state!=='validated'} onClick={()=>agreement&&onConstellation(agreement)}>Ver mi Constelación</button>
   </>}
   {!!agreement?.history?.length&&<details><summary>Cómo fue cambiando lo que acordamos</summary>{agreement.history.map(h=><div key={h.version}><h3>Versión {h.version}</h3><p>{h.faro_text}</p>{h.items.map((i,n)=><p key={n}>{i.label}{i.status==='withdrawn'?' · retirado':''}</p>)}</div>)}</details>}
  </>}
  {message&&<p role="status">{message}</p>}{error&&<p className="gm-error" role="alert">{error}</p>}
  {!momentReview&&<div className="gm-flow-alternatives"><button onClick={onPointHelp}>Prefiero una guía puntual</button><button onClick={onExplore}>Explorar por mi cuenta</button></div>}
 </section>
}
