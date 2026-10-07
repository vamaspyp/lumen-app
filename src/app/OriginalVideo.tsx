import {useEffect, useRef, useState} from 'react'

// The source remains unchanged. Loading an iframe is never evidence of playback.
export function OriginalVideo({url,title,destination}:{url:string;title:string;destination:string|null}) {
 const [opened,setOpened]=useState(false)
 const [unavailable,setUnavailable]=useState(false)
 const launch=useRef<HTMLButtonElement>(null)
 const restoreFocus=useRef(false)
 useEffect(()=>{if(!opened&&restoreFocus.current){launch.current?.focus();restoreFocus.current=false}},[opened])
 const close=()=>{restoreFocus.current=true;setUnavailable(true);setOpened(false)}
 let src:URL|null=null
 try{const candidate=new URL(url);if(candidate.protocol==='https:')src=candidate}catch{/* Invalid source metadata does not crash the experience. */}
 // The provider requires an identifying origin/referrer and a 200px minimum viewport.
 if(src&&['www.youtube.com','www.youtube-nocookie.com'].includes(src.hostname)){
  src.searchParams.set('origin',window.location.origin)
  src.searchParams.set('autoplay','0')
  src.searchParams.set('playsinline','1')
 }
 return <div className="source-video">
  {opened&&src?<>
   <iframe title={title} src={src.href} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onError={close} style={{width:'100%',aspectRatio:'16/9',minHeight:200,border:0}}/>
   <button className="ghost" type="button" onClick={close}>El reproductor no funciona</button>
  </>:<>
   {!src&&<p role="status">Esta fuente no ofrece un reproductor utilizable acá.</p>}
   {unavailable&&<p role="status">Podés abrir la fuente original o volver cuando quieras.</p>}
   <button ref={launch} className="primary" type="button" disabled={!src} onClick={()=>{setUnavailable(false);setOpened(true)}}>{unavailable?'Reintentar video':'Reproducir video original'}</button>
  </>}
  {destination&&<a className="source-text-link" style={{display:'block',marginTop:12,padding:'8px 0'}} href={destination} target="_blank" rel="noopener noreferrer">Ver en la fuente original ↗</a>}
 </div>
}
