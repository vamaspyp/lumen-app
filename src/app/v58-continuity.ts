import type {SourceItem} from '../greenfield/application/embryo'

export type ContextualPossibility = {
  item: SourceItem
  reason: string
  origin: 'fuente' | 'propio' | 'santuario' | 'tejido'
  exposedInMoment: boolean
}

