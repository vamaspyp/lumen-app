export const DOMAIN_MODULES = [
  { id: 'M0', name: 'Kernel' },
  { id: 'M1', name: 'Identity & Consent' },
  { id: 'M2', name: 'Life' },
  { id: 'M3', name: 'Accompaniment' },
  { id: 'M4', name: 'Source' },
  { id: 'M5', name: 'Sanctuary' },
  { id: 'M6', name: 'Tissue' },
  { id: 'M7', name: 'Knowledge' },
  { id: 'M8', name: 'Governance' },
  { id: 'M9', name: 'Operations' },
] as const

export type DomainModuleId = (typeof DOMAIN_MODULES)[number]['id']
