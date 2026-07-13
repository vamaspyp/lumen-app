import type { ModuleTokens } from '../lib/tokens'
import { ExperienceDetailCard } from './ExperienceDetailCard'

export function ExperiencePreview({
  content,
  tokens,
}: {
  content: Record<string, unknown>
  tokens: ModuleTokens
}) {
  const title          = (content.title as string) || ''
  const objective      = (content.objective as string) || ''
  const format         = (content.format as string) || ''
  const durationMin    = content.duration_min as number | undefined
  const author         = (content.author as string) || ''
  const provider       = (content.provider as string) || ''
  const whyNow         = (content.why_now as string) || ''
  const minimumStep    = (content.minimum_step as string) || ''
  const whatItIsNot    = (content.what_it_is_not as string) || ''
  const whenItHelps    = (content.when_it_helps as string) || ''
  const expectedCapabilityLabel = (content.expected_capability_label as string) || ''
  const preText        = (content.pre_text as string) || ''
  const descriptionShort = (content.description_short as string) || ''

  const formatLabel = [
    format && format.charAt(0).toUpperCase() + format.slice(1),
    durationMin != null && durationMin > 0 && `${durationMin} min`,
  ].filter(Boolean).join(' · ')

  const sourceLabel = [author, provider].filter(Boolean).join(' · ')

  return (
    <ExperienceDetailCard
      tokens={tokens}
      formatLabel={formatLabel || undefined}
      secondaryBadgeLabel={expectedCapabilityLabel || undefined}
      title={title}
      objective={objective || undefined}
      descriptionShort={descriptionShort || undefined}
      preText={preText || undefined}
      whenItHelps={whenItHelps || undefined}
      whyNow={whyNow || undefined}
      minimumStep={minimumStep || undefined}
      whatItIsNot={whatItIsNot || undefined}
      sourceLabel={sourceLabel || undefined}
    />
  )
}
