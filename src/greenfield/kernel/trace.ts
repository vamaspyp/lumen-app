export type TraceContext = Readonly<{
  traceId: string
  correlationId?: string
  causationId?: string
}>

export function newTraceId(): string {
  return crypto.randomUUID()
}
