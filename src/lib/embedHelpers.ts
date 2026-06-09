// ════════════════════════════════════════════════════════════════
// Helpers de embed: extraen IDs de URLs para iframes
// ════════════════════════════════════════════════════════════════

/** Extrae el video ID de una URL de YouTube. */
export function youtubeEmbedUrl(url: string): string | null {
  if (!url) return null
  // Soporta: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`
  }
  return null
}

/** Extrae el video ID de una URL de Vimeo. */
export function vimeoEmbedUrl(url: string): string | null {
  if (!url) return null
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? `https://player.vimeo.com/video/${m[1]}` : null
}

/** Convierte una URL de Spotify a embed. */
export function spotifyEmbedUrl(url: string): string | null {
  if (!url) return null
  // open.spotify.com/track/ID, /episode/ID, /show/ID, /playlist/ID, /album/ID
  const m = url.match(/open\.spotify\.com\/(track|episode|show|playlist|album)\/([a-zA-Z0-9]+)/)
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null
}

/** Convierte una URL de SoundCloud a embed iframe. */
export function soundcloudEmbedUrl(url: string): string | null {
  if (!url) return null
  if (!/soundcloud\.com\//.test(url)) return null
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23B88820&inverse=false&auto_play=false&show_user=true`
}