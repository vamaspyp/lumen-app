import type { ModuleTokens } from '../lib/tokens'

export function LumiOrb({ tokens }: { tokens: ModuleTokens }) {
  return (
    <>
      <style>{`
        @keyframes orbBreathe {
          0%, 100% {
            transform: scale(1);
            filter: blur(0px);
            box-shadow: 0 0 5px 0px rgba(143,163,140,0.2);
            opacity: 1;
          }
          40% {
            transform: scale(1.4);
            filter: blur(12px);
            box-shadow: 0 0 60px 30px rgba(143,163,140,0.3);
            opacity: 0.75;
          }
        }
      `}</style>
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${tokens.orbInner} 0%, ${tokens.orbMid} 25%, rgba(143,163,140,0.3) 60%, transparent 100%)`,
          animation: 'orbBreathe 10s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
    </>
  )
}
