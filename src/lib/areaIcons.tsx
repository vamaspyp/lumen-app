import React from 'react'

interface AreaIconProps {
  area: string
  size?: number
}

export function AreaIcon({ area, size = 32 }: AreaIconProps) {
  const s = size

  const wrap = (children: React.ReactNode) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {children}
    </svg>
  )

  switch (area) {
    case 'mente_emocion':
      return wrap(
        <>
          <circle cx="32" cy="32" r="30" fill="#8FA38C" fillOpacity="0.1" />
          <path
            d="M22,30 C22,20 42,20 42,30 C42,40 32,50 32,54 C32,50 22,40 22,30Z"
            fill="#8FA38C"
            fillOpacity="0.3"
            stroke="#8FA38C"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="31" r="2" fill="#5F7A5E" />
          <line x1="32" y1="34" x2="32" y2="42" stroke="#5F7A5E" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )

    case 'cuerpo_energia':
      return wrap(
        <>
          <circle cx="32" cy="32" r="30" fill="#8FA38C" fillOpacity="0.1" />
          <path
            d="M32,16 C26,16 18,24 18,32 C18,42 28,48 32,52 C36,48 46,42 46,32 C46,24 38,16 32,16Z"
            fill="#8FA38C"
            fillOpacity="0.3"
            stroke="#8FA38C"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          <line x1="32" y1="26" x2="32" y2="44" stroke="#5F7A5E" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="27" y1="33" x2="32" y2="28" stroke="#5F7A5E" strokeWidth="1" strokeLinecap="round" />
          <line x1="37" y1="38" x2="32" y2="33" stroke="#5F7A5E" strokeWidth="1" strokeLinecap="round" />
        </>
      )

    case 'vinculos':
      return wrap(
        <>
          <circle cx="32" cy="32" r="30" fill="#8FA38C" fillOpacity="0.1" />
          <circle cx="25" cy="30" r="12" fill="#8FA38C" fillOpacity="0.25" stroke="#8FA38C" strokeWidth="0.5" />
          <circle cx="39" cy="34" r="12" fill="#8FA38C" fillOpacity="0.25" stroke="#8FA38C" strokeWidth="0.5" />
        </>
      )

    case 'sentido_valores':
      return wrap(
        <>
          <circle cx="32" cy="32" r="30" fill="#8FA38C" fillOpacity="0.1" />
          <circle cx="32" cy="32" r="14" fill="#8FA38C" fillOpacity="0.15" />
          <circle cx="32" cy="32" r="5" fill="#8FA38C" fillOpacity="0.4" />
          <circle cx="32" cy="32" r="1.5" fill="#5F7A5E" />
          <line x1="32" y1="16" x2="32" y2="12" stroke="#8FA38C" strokeWidth="1" strokeLinecap="round" />
          <line x1="32" y1="48" x2="32" y2="52" stroke="#8FA38C" strokeWidth="1" strokeLinecap="round" />
          <line x1="16" y1="32" x2="12" y2="32" stroke="#8FA38C" strokeWidth="1" strokeLinecap="round" />
          <line x1="48" y1="32" x2="52" y2="32" stroke="#8FA38C" strokeWidth="1" strokeLinecap="round" />
          <line
            x1="32" y1="20" x2="32" y2="32"
            stroke="#5F7A5E" strokeWidth="1.2" strokeLinecap="round"
            transform="rotate(-30, 32, 32)"
          />
        </>
      )

    case 'trabajo_obra':
      return wrap(
        <>
          <circle cx="32" cy="32" r="30" fill="#8FA38C" fillOpacity="0.1" />
          <line x1="32" y1="48" x2="32" y2="28" stroke="#5F7A5E" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M25,35 C25,23 32,18 32,18 C32,18 39,23 39,35"
            fill="#8FA38C"
            fillOpacity="0.3"
            stroke="#8FA38C"
            strokeWidth="0.5"
            strokeLinecap="round"
          />
          <ellipse cx="32" cy="48" rx="5" ry="2" fill="#8FA38C" fillOpacity="0.2" />
        </>
      )

    case 'gozo':
      return wrap(
        <>
          <circle cx="32" cy="32" r="30" fill="#8FA38C" fillOpacity="0.1" />
          <path
            d="M32,22 Q42,30 39,38 Q36,44 32,46 Q28,44 25,38 Q22,30 32,22Z"
            fill="#8FA38C"
            fillOpacity="0.3"
            stroke="#8FA38C"
            strokeWidth="0.5"
          />
          <circle cx="32" cy="16" r="2" fill="#8FA38C" fillOpacity="0.5" />
          <circle cx="43" cy="21" r="1.5" fill="#8FA38C" fillOpacity="0.4" />
          <circle cx="21" cy="21" r="1.5" fill="#8FA38C" fillOpacity="0.4" />
          <circle cx="46" cy="32" r="1.5" fill="#8FA38C" fillOpacity="0.3" />
          <circle cx="18" cy="32" r="1.5" fill="#8FA38C" fillOpacity="0.3" />
        </>
      )

    default:
      return wrap(
        <circle cx="32" cy="32" r="30" fill="#8FA38C" fillOpacity="0.1" />
      )
  }
}
