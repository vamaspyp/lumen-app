import { getModuleTokens } from '../lib/tokens'

type NavItem={key:string;label:string;action:string;disabled?:boolean;icon:string}
export function BottomNav({currentSource,dispatch}:{currentSource:string;dispatch:(action:string,extra?:Record<string,string>)=>void}){
  const items:NavItem[]=[
    {key:'lumi',label:'Inicio',action:'go_home',icon:'⌂'},
    {key:'fuente',label:'Explorar',action:'open_fuente',icon:'◉'},
    {key:'process',label:'Mi proceso',action:'open_faros',icon:'♧'},
    {key:'community',label:'Comunidad',action:'open_community',icon:'♧',disabled:true},
    {key:'sanctuary',label:'Santuario',action:'open_sanctuary',icon:'▢'},
  ]
  const active=currentSource==='fuente'?'fuente':currentSource==='sanctuary'?'sanctuary':currentSource==='circles'?'community':'lumi'
  const tokens=getModuleTokens(currentSource)
  return <nav aria-label="Navegación principal" style={{
    position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'min(100%,760px)',
    zIndex:20,display:'grid',gridTemplateColumns:'repeat(5,1fr)',alignItems:'end',
    padding:'8px 10px max(10px,env(safe-area-inset-bottom))',
    background:'rgba(250,248,243,.94)',backdropFilter:'blur(18px)',
    borderTop:'1px solid rgba(85,98,74,.12)',boxShadow:'0 -8px 28px rgba(56,48,35,.04)'
  }}>
    {items.map(i=>{const on=active===i.key;return <button key={i.key} disabled={i.disabled}
      onClick={()=>!i.disabled&&!on&&dispatch(i.action)}
      aria-current={on?'page':undefined}
      style={{border:0,background:'transparent',padding:'5px 2px 2px',minHeight:48,cursor:i.disabled?'default':on?'default':'pointer',
        opacity:i.disabled ? .42 : 1,color:on?tokens.accentDeep:tokens.textMuted,display:'flex',flexDirection:'column',gap:3,alignItems:'center',justifyContent:'center'}}>
      <span aria-hidden style={{fontSize:17,lineHeight:1,fontFamily:'Georgia,serif',transform:on?'scale(1.08)':'none'}}>{i.icon}</span>
      <span style={{fontSize:9.5,letterSpacing:'.01em',fontWeight:on?600:450,whiteSpace:'nowrap'}}>{i.label}</span>
      <span style={{width:on?14:0,height:1.5,borderRadius:9,background:tokens.accentDeep,transition:'width .2s ease'}}/>
    </button>})}
  </nav>
}
