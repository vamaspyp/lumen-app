// LUMEN Premium v2.1 — tokens compartidos. La identidad es única;
// los módulos conservan sólo matices funcionales, nunca una app distinta.
export function withAlpha(hex:string,alpha:number):string{
  const h=hex.replace('#',''); const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
const PREMIUM={
  background:'#FAF8F3', card:'#FFFDF9', border:'#EAE4D7',
  salvia:'#A7B096', oliva:'#55624A', humo:'#6B6B68', oro:'#DCC9A3'
} as const
export type ModuleKey='lumi'|'fuente'|'sanctuary'|'circles'
export interface ModuleTokens{
  background:string;cardBg:string;cardBorder:string;accent:string;accentDeep:string;
  accentSoft10:string;accentSoft20:string;accentSoft30:string;textPrimary:string;
  textSecondary:string;textMuted:string;orbInner:string;orbMid:string;orbOuter:string;
  orbGlow:string;shadow:string;energy:string;source:ModuleKey
}
export function getModuleTokens(contentSource:string|undefined|null):ModuleTokens{
  const source:ModuleKey=contentSource==='fuente'?'fuente':contentSource==='sanctuary'?'sanctuary':contentSource==='circles'?'circles':'lumi'
  const accent=source==='fuente'?PREMIUM.oro:source==='circles'?'#929A8B':source==='sanctuary'?'#879784':PREMIUM.salvia
  const energy=source==='fuente'?'claridad · sabiduría':source==='sanctuary'?'intimidad · memoria':source==='circles'?'encuentro · conexión':'presencia · calma'
  return{
    background:PREMIUM.background,cardBg:'rgba(255,253,249,.92)',cardBorder:'rgba(85,98,74,.12)',
    accent,accentDeep:PREMIUM.oliva,accentSoft10:withAlpha(accent,.10),accentSoft20:withAlpha(accent,.18),accentSoft30:withAlpha(accent,.28),
    textPrimary:'#292822',textSecondary:'#5F5C55',textMuted:'#8B877F',
    orbInner:'#FFF8E9',orbMid:PREMIUM.oro,orbOuter:'#B78A45',orbGlow:'0 0 38px rgba(220,201,163,.48)',
    shadow:'0 12px 34px rgba(56,48,35,.07)',energy,source
  }
}
