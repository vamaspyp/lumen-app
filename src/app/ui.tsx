import type { ReactNode } from 'react'
import { IMG, type Space, type Utility } from './types'

export type IconName = 'home'|'life'|'explore'|'heart'|'people'|'search'|'bell'|'settings'|'leaf'|'arrow'|'book'|'sun'|'play'|'close'|'download'|'trash'|'pause'|'repeat'|'vary'|'apply'|'calendar'|'shield'

export function Icon({ name }: { name: IconName }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  const p: Record<IconName, ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></>,
    life: <><circle cx="12" cy="8" r="3"/><path d="M5.5 20c.8-4.2 3-6.3 6.5-6.3s5.7 2.1 6.5 6.3"/></>,
    explore: <><circle cx="12" cy="12" r="8"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/></>,
    heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.2A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>,
    people: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3.5 20c.7-4 2.7-6 5.5-6s4.8 2 5.5 6"/><path d="M14 15c3.5-.6 5.6 1.1 6.5 4"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></>,
    bell: <><path d="M6 16h12c-1.2-1.3-1.5-2.6-1.5-5A4.5 4.5 0 0 0 12 6.5 4.5 4.5 0 0 0 7.5 11c0 2.4-.3 3.7-1.5 5Z"/><path d="M10 19h4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></>,
    leaf: <><path d="M19 5C11 5 6 9 6 15c4 1 10-1 13-10Z"/><path d="M6 19c1-5 4-8 9-10"/></>,
    arrow: <><path d="M5 12h13"/><path d="m14 8 4 4-4 4"/></>,
    book: <><path d="M4 5.5c4-1.3 6 .3 8 2v11c-2-1.7-4-3.3-8-2V5.5Z"/><path d="M20 5.5c-4-1.3-6 .3-8 2v11c2-1.7 4-3.3 8-2V5.5Z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></>,
    play: <path d="m9 7 8 5-8 5V7Z"/>,
    close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
    download: <><path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><path d="M5 20h14"/></>,
    trash: <><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m7 7 1 13h8l1-13"/></>,
    pause: <><path d="M9 6v12M15 6v12"/></>,
    repeat: <><path d="M4 9a7 7 0 0 1 12-3l2 2"/><path d="M18 4v4h-4"/><path d="M20 15a7 7 0 0 1-12 3l-2-2"/><path d="M6 20v-4h4"/></>,
    vary: <><path d="M5 6h5l9 12"/><path d="m16 18 3 0 0-3"/><path d="M5 18h5l3-4"/><path d="m16 6 3 0 0 3"/></>,
    apply: <><circle cx="12" cy="12" r="8"/><path d="m8 12 2.5 2.5L16 9"/></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.5 2.8 7.5 7 10 4.2-2.5 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
  }
  return <svg {...common}>{p[name]}</svg>
}

export function Logo() {
  return <div className="brand"><span>LUMEN</span><small>SABERES APLICADOS<br/>PARA MEJORAR VIDAS</small></div>
}

export function Sidebar({ active, go, utility, onUtility, authenticated, onSignOut }: { active: Space; go: (space: Space) => void; utility: Utility; onUtility: (utility: Utility) => void; authenticated: boolean; onSignOut: () => void }) {
  const links: Array<[Space, string, IconName]> = [['home','Inicio','home'],['life','Mi Vida','life'],['explore','Explorar','explore'],['sanctuary','Santuario','heart'],['tissue','Tejido','people']]
  return <aside className="sidebar">
    <button className="brand-button" onClick={() => go('home')} type="button"><Logo/></button>
    <nav className="nav-main" aria-label="Espacios de LUMEN">{links.map(([space,label,icon]) => <button key={space} type="button" className={active===space ? 'active' : ''} onClick={() => go(space)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
    <div className="nav-separator"/>
    <nav className="nav-minor" aria-label="Utilidades">
      <button type="button" onClick={() => go('explore')}><Icon name="search"/><span>Buscar</span></button>
      <button type="button" className={utility==='notifications' ? 'active' : ''} onClick={() => onUtility(utility==='notifications' ? 'none' : 'notifications')}><Icon name="bell"/><span>Notificaciones</span></button>
      <button type="button" className={utility==='settings' ? 'active' : ''} onClick={() => onUtility(utility==='settings' ? 'none' : 'settings')}><Icon name="settings"/><span>Ajustes</span></button>
    </nav>
    <blockquote>Una vida<br/>más consciente<br/>también es una<br/>vida más libre.</blockquote>
    {authenticated && <button className="text-action signout" onClick={onSignOut} type="button">Cerrar sesión</button>}
  </aside>
}

export function Profile({ authenticated }: { authenticated: boolean }) {
  return <div className="profile"><img src={IMG.portrait} alt=""/><span><b>{authenticated ? 'Tu espacio' : 'LUMEN'}</b><small>{authenticated ? 'Una vida en proceso' : 'Entrá cuando quieras'}</small></span><span>⌄</span></div>
}

export function SpaceHero({ kicker, title, text, image }: { kicker: string; title: string; text: string; image: string }) {
  return <header className="space-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,252,247,.98),rgba(255,252,247,.40)),url(${image})` }}><div><p>{kicker}</p><h1>{title}</h1><span>{text}</span></div></header>
}

export function PrivateGate({ name, email, setEmail, request, message, goHome, goExplore }: { name: string; email: string; setEmail: (value: string) => void; request: () => void; message: string; goHome: () => void; goExplore: () => void }) {
  return <section className="gate-page"><div className="gate-card"><span className="orb"/><p>{name.toUpperCase()}</p><h1>Este espacio se construye alrededor de tu vida.</h1><p className="gate-copy">Entrá para conservar continuidad, memoria soberana y aquello que decidís hacer propio. También podés seguir explorando LUMEN sin identificarte.</p><div className="gate-form"><input aria-label="Correo" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com"/><button onClick={request} type="button">Enviarme un enlace</button></div>{message && <small className="status-message">{message}</small>}<div className="gate-links"><button onClick={goExplore} type="button">Seguir explorando</button><button onClick={goHome} type="button">Volver al inicio</button></div></div></section>
}
