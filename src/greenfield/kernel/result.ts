export type DomainErrorCode =
  | 'VALIDATION'
  | 'AUTHORIZATION'
  | 'COVERAGE'
  | 'COMPETENCE'
  | 'SAFETY_BLOCK'
  | 'EXTERNAL_PROVIDER'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'INVARIANT'

export type DomainError = Readonly<{
  code: DomainErrorCode
  message: string
  retryable: boolean
}>

export type Result<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: DomainError }>
