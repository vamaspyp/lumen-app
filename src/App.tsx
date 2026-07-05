import { useLumi } from './lib/useLumi'
import { getModuleTokens } from './lib/tokens'
import { LumiOrb } from './components/LumiOrb'
import { BottomNav } from './components/BottomNav'
import { ContentArea } from './components/ContentArea'
import { LandingScan } from './components/LandingScan'

function App() {
  const { state, dispatch, linkAccount } = useLumi()
  const tokens = getModuleTokens(state.contentSource)

  const isScan = state.lumiContentType === 'lumi_scan'
  const isSimpleView = ['empty_presence', 'landing_scan', 'landing_scan_invite', 'scan_complete'].includes(state.lumiContentType)

  const activeRunId = (state.lumiContentData?.run_id as string)
    || state.currentExperienceRunId
    || ''

  const renderPerlaBlock = (marginBottom: string) => {
    const perla = (state.lumiContentData?.culture_phrase as string) || ''
    const mensaje = state.lumiMessage || ''
    if (!perla && !mensaje) return null
    return (
      <div
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          textAlign: 'center',
          lineHeight: 1.5,
          margin: `0 auto ${marginBottom}`,
          maxWidth: '38ch',
        }}
      >
        {perla && (
          <span
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontStyle: 'italic',
              color: tokens.textMuted,
              opacity: 0.75,
              marginBottom: (state.reflectionHint || mensaje) ? '0.65rem' : 0,
              letterSpacing: '0.005em',
            }}
          >
            "{perla}"
          </span>
        )}
        {state.reflectionHint && (
          <span
            style={{
              display: 'block',
              fontSize: '0.9rem',
              fontStyle: 'italic',
              color: tokens.textSecondary,
              opacity: 0.9,
              marginBottom: mensaje ? '0.65rem' : 0,
            }}
          >
            {state.reflectionHint}
          </span>
        )}
        {mensaje && (
          <span
            style={{
              display: 'block',
              fontSize: '1.05rem',
              color: tokens.textPrimary,
            }}
          >
            {mensaje}
          </span>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes lumiAppear {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lumi-bg {
          transition: background-color 0.6s ease, color 0.6s ease;
        }
      `}</style>

      <div
        className="lumi-bg"
        style={{
          background: tokens.background,
          minHeight: '100vh',
          color: tokens.textPrimary,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          paddingTop: (isScan || isSimpleView) ? 0 : '2rem',
          paddingLeft: '1.25rem',
          paddingRight: '1.25rem',
          boxSizing: 'border-box',
        }}
      >
        {isScan ? (
          <LandingScan
            message={state.lumiMessage}
            actions={state.lumiActions}
            contentData={state.lumiContentData}
            tokens={tokens}
            onComplete={() => dispatch('complete_scan')}
          />
        ) : isSimpleView ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: 'calc(100vh - 70px)',
              paddingTop: '0',
              paddingBottom: '0',
            }}
          >
            {/* SECCIÓN 1: orb */}
            <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LumiOrb tokens={tokens} />
            </div>

            {/* SECCIÓN 2: mensaje */}
            <div
              style={{
                flex: '0 0 auto',
                padding: '0 2rem',
                marginBottom: '2rem',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <div
                key={state.lumiMessage}
                style={{ animation: 'lumiAppear 600ms ease-out both', width: '100%', textAlign: 'center' }}
              >
                {renderPerlaBlock('0')}
              </div>
            </div>

            {/* SECCIÓN 3: pills */}
            <div style={{ flex: '0 0 auto', marginBottom: '4rem' }}>
              <ContentArea
                contentType={state.lumiContentType}
                contentData={state.lumiContentData}
                actions={state.lumiActions}
                dispatch={dispatch}
                tokens={tokens}
                experienceRunId={activeRunId}
                onRegister={linkAccount}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              maxWidth: 560,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* LUMI: orb permanente en el centro, solo cambia de color */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <LumiOrb tokens={tokens} />
            </div>

            <div
              key={state.lumiMessage}
              style={{ animation: 'lumiAppear 600ms ease-out both', width: '100%', textAlign: 'center' }}
            >
              {renderPerlaBlock('1.75rem')}

              <ContentArea
                contentType={state.lumiContentType}
                contentData={state.lumiContentData}
                actions={state.lumiActions}
                dispatch={dispatch}
                tokens={tokens}
                experienceRunId={activeRunId}
                onRegister={linkAccount}
              />
            </div>

            <details
              style={{
                marginTop: '3rem',
                width: '100%',
                fontSize: '0.7rem',
                color: tokens.textMuted,
                opacity: 0.6,
              }}
            >
              <summary style={{ cursor: 'pointer' }}>debug</summary>
              <pre
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '0.65rem',
                }}
              >
                {JSON.stringify(
                  {
                    code: state.lumiCode,
                    content_type: state.lumiContentType,
                    source: state.contentSource,
                    module: tokens.source,
                    session: state.currentSessionId,
                    resource: state.currentResourceId,
                    sanctuary_item: state.currentSanctuaryItemId,
                    experience_run: state.currentExperienceRunId,
                    ik: state.selectedIkKey,
                    checkin: {
                      state: state.checkinState,
                      area: state.checkinArea,
                      intent: state.checkinHelpIntent,
                      time: state.checkinTime,
                    },
                    actions: state.lumiActions.map(a => `${a.label} → ${a.action}`),
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        )}
      </div>
      <div style={{ height: '80px', flexShrink: 0 }} />
      <BottomNav currentSource={state.contentSource} dispatch={dispatch} />
    </>
  )
}

export default App
