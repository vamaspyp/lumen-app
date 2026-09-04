export const DOMAIN_EVENT_TYPES = [
  'MomentReceived',
  'MomentInterpreted',
  'TrajectoryCreated',
  'TrajectoryChanged',
  'TrajectoryPaused',
  'CandidateSetGenerated',
  'CandidateExposed',
  'HelpSelected',
  'HelpRejected',
  'NoMatchDeclared',
  'HelpStarted',
  'HelpCompleted',
  'OutcomeReported',
  'SanctuarySaved',
  'SanctuaryUpdated',
  'SanctuaryDeleted',
  'HelpPossibilityAdded',
  'HelpPossibilityActivated',
  'HelpPossibilityRestricted',
  'HelpPossibilityRetired',
  'CoverageGapDetected',
  'CircleCreated',
  'CircleJoined',
  'CircleLeft',
  'ContributionOffered',
  'ContributionReceived',
  'EvidenceRecorded',
  'ClaimProposed',
  'ClaimRevised',
  'ClaimRetired',
  'PolicyChanged',
  'PolicyRolledBack',
  'CustodyBlocked',
  'IncidentOpened',
  'IncidentResolved',
  'ProactiveFollowupScheduled',
  'ProactiveFollowupSent',
  'ProactiveFollowupCancelled',
] as const

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number]

export type DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> = Readonly<{
  eventId: string
  occurredAt: string
  eventType: DomainEventType
  aggregateType: string
  aggregateId: string
  traceId: string
  causationId?: string
  correlationId?: string
  contractVersion: string
  policyVersion?: string
  provenance: 'person' | 'system' | 'external' | 'derived'
  payload: TPayload
}>
