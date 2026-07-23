import { useEffect, useRef, useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'

// Trazo cursivo único de "Lumen": trazo previo, las cinco letras conectadas
// sin levantar la pluma y trazo posterior de remate — un solo <path>, un
// solo gesto. El viewBox es fijo (coordenadas del vector); el tamaño real
// en pantalla lo decide el contenedor vía CSS responsivo, nunca acá.
const WORDMARK_PATH =
  'M 0 168 C 18 152 34 132 46 108 C 34 88 40 58 66 46 C 92 34 112 50 98 70 ' +
  'C 88 84 70 92 62 112 C 56 134 58 160 66 196 C 80 208 100 204 120 184 ' +
  'C 123.5 200 127 200 134 190 C 161.8 190 154.2 132 182 132 C 209.8 132 202.2 190 230 190 ' +
  'C 232.5 200 235 200 240 190 C 258.6 190 253.4 132 272 132 C 290.6 132 285.4 190 304 190 ' +
  'C 322.6 190 317.4 132 336 132 C 354.6 132 349.4 190 368 190 C 370.5 200 373 200 378 190 ' +
  'C 388 180 372 126 408 112 C 444 98 456 142 422 166 C 398 184 412 186 452 190 ' +
  'C 454.5 200 457 200 462 190 C 489.8 190 482.2 132 510 132 C 537.8 132 530.2 190 558 190 ' +
  'C 578 198 603 206 628 178 C 653 158 678 154 708 146'

const VIEW_BOX = '-10 0 718 260'

/**
 * Wordmark trazable de LUMEN para la intro: una mano escribiendo "Lumen" en
 * cursiva, de izquierda a derecha, en un único gesto continuo, vía
 * stroke-dasharray/stroke-dashoffset real sobre un path SVG (no texto HTML,
 * no línea decorativa aparte).
 */
export function LumenWordmark({
  tokens,
  writingMs,
  reduced = false,
}: {
  tokens: ModuleTokens
  writingMs: number
  reduced?: boolean
}) {
  const pathRef = useRef<SVGPathElement | null>(null)
  const [length, setLength] = useState(0)
  const [drawn, setDrawn] = useState(reduced)

  useEffect(() => {
    setLength(pathRef.current?.getTotalLength() ?? 0)
  }, [])

  useEffect(() => {
    if (reduced || !length) return
    // Doble rAF: deja que el navegador pinte al menos un frame con el
    // trazo oculto (dashoffset = length) antes de animar hacia 0 — con un
    // solo rAF ambos estados caen en el mismo frame y la transición nunca
    // se dispara (el trazo aparece ya completo, sin animar).
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setDrawn(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [length, reduced])

  return (
    <svg
      viewBox={VIEW_BOX}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: 'min(87vw, 640px)',
        maxWidth: '92vw',
        height: 'auto',
        display: 'block',
        overflow: 'visible',
      }}
    >
      <path
        ref={pathRef}
        d={WORDMARK_PATH}
        fill="none"
        stroke={tokens.accentDeep}
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          // Strings, no numbers: React le agrega "px" a valores numéricos
          // de estilos que no reconoce como unitless, y stroke-dasharray/
          // stroke-dashoffset con "px" se resuelven distinto a las unidades
          // de usuario del path — el trazo queda invisible/siempre completo.
          strokeDasharray: String(length || 1),
          strokeDashoffset: String(drawn ? 0 : length || 1),
          // Ojo: la transición se habilita recién cuando `drawn` pasa a
          // true, nunca antes. Si se habilitara ya en cuanto `length` se
          // conoce, el propio salto de "longitud desconocida" (1) a
          // "longitud real medida" también quedaría animado y se comería
          // gran parte del recorrido antes de que arrancara el dibujo real.
          transition: reduced || !drawn ? 'none' : `stroke-dashoffset ${writingMs}ms linear`,
        }}
      />
    </svg>
  )
}
