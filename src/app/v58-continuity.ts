import type {RepertoireItem, SanctuaryEntry, SourceItem} from '../greenfield/application/embryo'

export type ContextualPossibility = {
  item: SourceItem
  reason: string
  origin: 'fuente' | 'propio' | 'santuario' | 'tejido'
  exposedInMoment: boolean
}

const humanTypes = new Set(['professional_support','institutional_service','conversation'])

export function composeV58Constellation(
  exposed: SourceItem[],
  own: RepertoireItem[],
  sanctuary: SanctuaryEntry[],
  human: SourceItem[],
  capacityKeys: string[],
  memoryAllowed: boolean,
): ContextualPossibility[] {
  const ownIds = new Set(memoryAllowed ? own.filter(r =>
    r.user_confirmed && r.capability_keys?.some(key=>capacityKeys.includes(key))
  ).map(r=>r.help_id) : [])
  const savedIds = new Set(memoryAllowed ? sanctuary.filter(e=>e.source_help_id).map(e=>e.source_help_id) : [])
  const exposedIds = new Set(exposed.map(item=>item.help_id))
  const matches = (item:SourceItem) => !capacityKeys.length || item.capacities?.some(key=>capacityKeys.includes(key))
  const candidates = [...exposed,...human.filter(item=>matches(item))]
  const unique = candidates.filter((item,index)=>candidates.findIndex(other=>other.help_id===item.help_id)===index)
  const ownItems = unique.filter(item=>ownIds.has(item.help_id))
  const savedItems = unique.filter(item=>savedIds.has(item.help_id)&&!ownIds.has(item.help_id))
  const humanItems = unique.filter(item=>humanTypes.has(item.help_type)&&!ownIds.has(item.help_id)&&!savedIds.has(item.help_id))
  const otherItems = unique.filter(item=>!ownIds.has(item.help_id)&&!savedIds.has(item.help_id)&&!humanTypes.has(item.help_type))
  const ordered = [...ownItems.slice(0,1),...savedItems.slice(0,1),...otherItems.slice(0,4),...humanItems.slice(0,1)]
  return ordered.filter((item,index)=>ordered.findIndex(other=>other.help_id===item.help_id)===index).slice(0,6).map(item=>{
    const origin = ownIds.has(item.help_id)?'propio':savedIds.has(item.help_id)?'santuario':humanTypes.has(item.help_type)?'tejido':'fuente'
    return {
      item,origin,exposedInMoment:exposedIds.has(item.help_id),
      reason: origin==='propio'?'Lo reconociste como propio y se relaciona con lo que expresaste hoy.'
        :origin==='santuario'?'Elegiste conservarlo y puede volver a servirte ahora.'
        :origin==='tejido'?'Una forma de acompañamiento humano relacionada con este Momento.'
        :'Una posibilidad de Fuente relacionada con lo que expresaste hoy.',
    }
  })
}
