export type OperationalLogLevel = 'info' | 'warn' | 'error'

export type OperationalLog = Readonly<{
  at: string
  level: OperationalLogLevel
  event: string
  traceId: string
  attributes?: Readonly<Record<string, unknown>>
}>

const SENSITIVE_MARKERS = ['email', 'name', 'content', 'text', 'message', 'token', 'secret', 'password']

function sanitizeAttributes(attributes: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(attributes).filter(([key]) => {
      const normalized = key.toLowerCase()
      return SENSITIVE_MARKERS.every((marker) => !normalized.includes(marker))
    }),
  )
}

export function emitOperationalLog(
  level: OperationalLogLevel,
  event: string,
  traceId: string,
  attributes: Record<string, unknown> = {},
): OperationalLog {
  const safeAttributes = sanitizeAttributes(attributes)
  const record: OperationalLog = {
    at: new Date().toISOString(),
    level,
    event,
    traceId,
    ...(Object.keys(safeAttributes).length > 0 ? { attributes: safeAttributes } : {}),
  }

  const line = JSON.stringify(record)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)

  return record
}
