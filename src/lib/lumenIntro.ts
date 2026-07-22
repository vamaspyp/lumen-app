// Capa visual local: solo decide si LumenIntro ya se reprodujo en esta
// sesión de navegación. No es estado de negocio ni participa del dispatcher.
const INTRO_SESSION_KEY = 'lumen_intro_shown'

export function hasSeenLumenIntro(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === '1'
  } catch {
    // sessionStorage bloqueado (ej. navegación privada estricta): no podemos
    // deduplicar de forma confiable, así que no arriesgamos mostrar la intro.
    return true
  }
}

export function markLumenIntroSeen(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, '1')
  } catch {
    // no persiste, pero no debe bloquear el cierre de la intro
  }
}
