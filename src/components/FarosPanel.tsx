import type { ModuleTokens } from '../lib/tokens'
import { Pill } from './Pill'

type DispatchFn = (action: string, extra?: Record<string, string>) => void

interface FaroActionLike {
  label?: string
  action?: string
  value?: string
  variant?: string
  [key: string]: unknown
}

interface FaroRow {
  id?: string
  user_area_faro_id?: string
  area?: string
  area_key?: string
  area_label?: string
  faro_key?: string
  faro_label?: string
  label?: string
  hint?: string
  status?: string
  activated_at?: string
  paused_at?: string
  closed_at?: string
  close_reason?: string
  close_reflection?: string
  action?: string
  value?: string
  actions?: FaroActionLike[]
  [key: string]: unknown
}

interface TagLike {
  area?: string
  area_key?: string
  area_label?: string
  faro_key?: string
  label?: string
  hint?: string
  action?: string
  value?: string
  [key: string]: unknown
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activos',
  paused: 'Pausados',
  closed: 'Cerrados',
}

const areaKeyOf = (o: { area_key?: string; area?: string }) => o.area_key || o.area || '—'
const areaLabelOf = (o: { area_label?: string; area?: string; area_key?: string }) =>
  o.area_label || o.area || o.area_key || 'Sin área'

// Agrupa un array por clave de área preservando el orden de primera
// aparición — es render, no negocio: no filtra ni oculta nada.
function groupByArea<T extends { area_key?: string; area?: string; area_label?: string }>(
  items: T[]
): Array<{ key: string; label: string; items: T[] }> {
  const order: string[] = []
  const map = new Map<string, { key: string; label: string; items: T[] }>()
  for (const item of items) {
    const key = areaKeyOf(item)
    if (!map.has(key)) {
      map.set(key, { key, label: areaLabelOf(item), items: [] })
      order.push(key)
    }
    map.get(key)!.items.push(item)
  }
  return order.map(key => map.get(key)!)
}

// Reenvía exactamente lo que Supabase declaró en el objeto de action (o de
// etiqueta): la action, y cualquier otro campo contextual presente, como
// strings. `extra` es el fallback de identidad del Faro (user_area_faro_id)
// que se agrega siempre, sin pisar lo que el propio objeto ya declare.
function dispatchDeclared(
  dispatch: DispatchFn,
  obj: Record<string, unknown>,
  extra: Record<string, string> = {}
) {
  const actionName = typeof obj.action === 'string' ? obj.action : ''
  if (!actionName) return
  const params: Record<string, string> = { ...extra }
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'action' || key === 'label' || key === 'hint' || key === 'variant' || val == null) continue
    params[key] = String(val)
  }
  dispatch(actionName, params)
}

function FaroCard({
  faro,
  dispatch,
  tokens,
}: {
  faro: FaroRow
  dispatch: DispatchFn
  tokens: ModuleTokens
}) {
  const id = (faro.user_area_faro_id as string) || (faro.id as string) || ''
  const title = faro.label || faro.faro_label || faro.faro_key || ''
  const identity: Record<string, string> = id ? { user_area_faro_id: id } : {}

  const declaredActions = Array.isArray(faro.actions) ? faro.actions : []
  const isRowClickable = !declaredActions.length && typeof faro.action === 'string' && faro.action

  const dates = [
    faro.status === 'active' && faro.activated_at ? `desde ${new Date(faro.activated_at as string).toLocaleDateString('es')}` : '',
    faro.status === 'paused' && faro.paused_at ? `en pausa desde ${new Date(faro.paused_at as string).toLocaleDateString('es')}` : '',
    faro.status === 'closed' && faro.closed_at ? `cerrado ${new Date(faro.closed_at as string).toLocaleDateString('es')}` : '',
  ].filter(Boolean).join(' · ')

  return (
    <div
      onClick={isRowClickable ? () => dispatchDeclared(dispatch, faro, identity) : undefined}
      role={isRowClickable ? 'button' : undefined}
      tabIndex={isRowClickable ? 0 : undefined}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '14px',
        padding: '0.875rem 1.125rem',
        fontFamily: 'inherit',
        cursor: isRowClickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontSize: '1rem', color: tokens.textPrimary, fontWeight: 500 }}>{title}</div>
      {faro.hint && (
        <div style={{ fontSize: '0.8rem', color: tokens.textSecondary, marginTop: '0.25rem' }}>{faro.hint as string}</div>
      )}
      {dates && (
        <div style={{ fontSize: '0.7rem', color: tokens.textMuted, marginTop: '0.35rem', fontStyle: 'italic' }}>{dates}</div>
      )}
      {faro.status === 'closed' && (faro.close_reflection as string) && (
        <div style={{ fontSize: '0.78rem', color: tokens.textSecondary, marginTop: '0.5rem', lineHeight: 1.4, fontStyle: 'italic' }}>
          “{faro.close_reflection as string}”
        </div>
      )}

      {declaredActions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
          {declaredActions.map((a, idx) => (
            <Pill
              key={`${a.action}-${idx}`}
              label={a.label || String(a.action)}
              variant={(a.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
              onClick={() => dispatchDeclared(dispatch, a, identity)}
              tokens={tokens}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Etiqueta activable con estructura y altura uniformes: título siempre
// arriba, hint siempre reservado (hasta 2 líneas) aunque venga vacío, para
// que ninguna quede desproporcionada frente a las demás.
function TagChip({
  tag,
  dispatch,
  tokens,
}: {
  tag: TagLike
  dispatch: DispatchFn
  tokens: ModuleTokens
}) {
  const hint = tag.hint || ''
  return (
    <button
      onClick={() => dispatchDeclared(dispatch, tag)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        minHeight: '5rem',
        width: '100%',
        boxSizing: 'border-box',
        padding: '0.65rem 0.85rem',
        borderRadius: '12px',
        background: tokens.accentSoft20,
        border: `1px solid ${tokens.accentSoft30}`,
        color: tokens.accentDeep,
        fontFamily: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.3 }}>
        {tag.label || tag.faro_key}
      </span>
      <span
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '1.9rem',
          fontSize: '0.72rem',
          color: tokens.textMuted,
          marginTop: '0.3rem',
          lineHeight: 0.95,
        }}
      >
        {hint}
      </span>
    </button>
  )
}

export function FarosPanel({
  content,
  dispatch,
  tokens,
}: {
  content: Record<string, unknown>
  dispatch: DispatchFn
  tokens: ModuleTokens
}) {
  const faros = (content.faros as FaroRow[]) || []
  const availableTags = (content.available_tags as TagLike[]) || []
  const privacyHint = (content.privacy_hint as string) || ''

  const faroAreaGroups = groupByArea(faros)
  const tagAreaGroups = groupByArea(availableTags)
  const knownStatusOrder = ['active', 'paused', 'closed']

  return (
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {faroAreaGroups.length === 0 && (
        <p style={{ fontSize: '0.9rem', color: tokens.textMuted, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
          Todavía no elegiste Faros para este territorio.
        </p>
      )}

      {faroAreaGroups.map(areaGroup => {
        const statusGroups = knownStatusOrder
          .map(status => ({ status, label: STATUS_LABELS[status], items: areaGroup.items.filter(f => f.status === status) }))
          .filter(g => g.items.length > 0)
        const otherItems = areaGroup.items.filter(f => !knownStatusOrder.includes(f.status || ''))
        if (otherItems.length) statusGroups.push({ status: 'other', label: 'Otros', items: otherItems })

        return (
          <div key={areaGroup.key}>
            <div style={{ fontSize: '0.78rem', color: tokens.textPrimary, fontWeight: 600, marginBottom: '0.75rem' }}>
              {areaGroup.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {statusGroups.map(sg => (
                <div key={sg.status}>
                  <div style={{ fontSize: '0.68rem', color: tokens.accentDeep, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: '0.5rem' }}>
                    {sg.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {sg.items.map((faro, idx) => (
                      <FaroCard key={(faro.user_area_faro_id as string) || (faro.id as string) || idx} faro={faro} dispatch={dispatch} tokens={tokens} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {tagAreaGroups.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', color: tokens.accentDeep, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: '0.85rem' }}>
            Etiquetas disponibles
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {tagAreaGroups.map(areaGroup => (
              <div key={areaGroup.key}>
                <div style={{ fontSize: '0.72rem', color: tokens.textSecondary, fontWeight: 500, marginBottom: '0.5rem' }}>
                  {areaGroup.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  {areaGroup.items.map((tag, idx) => (
                    <TagChip key={`${tag.faro_key}-${idx}`} tag={tag} dispatch={dispatch} tokens={tokens} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {privacyHint && (
        <p style={{ fontSize: '0.72rem', color: tokens.textMuted, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
          {privacyHint}
        </p>
      )}
    </div>
  )
}
