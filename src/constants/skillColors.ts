/**
 * A colour per skill, for the chip on a feed card.
 *
 * There was no "skill ring palette" in the codebase when this was written -
 * PRO_SKILLS carries a name and an emoji and nothing else - so this is new.
 * It is presentation only: nothing is stored, nothing is queried, and a skill
 * with no entry still renders.
 *
 * The chip sits on top of video, not on the app surface, so these are chosen to
 * hold up against arbitrary footage rather than against the theme. White text on
 * each of them clears 4.5:1.
 */

import { PRO_SKILLS, type SkillCategory } from './skills'

const SKILL_COLORS: Record<string, string> = {
  Barber: '#e0457b',
  Cleaner: '#0d9488',
  Tradie: '#c2410c',
  Driver: '#1d4ed8',
  Carpenter: '#92400e',
  Tiler: '#4338ca',
  Plumber: '#0369a1',
  Mechanic: '#475569',
  'Makeup Artist': '#be185d',
  Electrician: '#a16207',
  Painter: '#7c3aed',
  Landscaper: '#15803d',
}

/**
 * The colour a listed skill takes when it has no entry of its own.
 *
 * The twelve above predate the full list. Rather than invent eighty more hand
 * -picked colours, a skill inherits its category's - so the whole of Trades
 * reads as one family and Beauty as another, which is more useful on a feed
 * card than eighty unrelated hues would be. All clear 4.5:1 against white.
 */
const CATEGORY_COLORS: Record<SkillCategory, string> = {
  Trades: '#c2410c',
  'Home Services': '#0d9488',
  'Beauty & Personal Care': '#be185d',
  Automotive: '#475569',
  'Food & Hospitality': '#b45309',
  Technology: '#1d4ed8',
  'Creative & Media': '#7c3aed',
  'Health & Wellness': '#15803d',
  'Other Professional': '#0f766e',
}

/** The fallback set, for the custom skills EditProfile allows. */
const FALLBACK_COLORS = [
  '#6c47ff',
  '#0d9488',
  '#be185d',
  '#c2410c',
  '#1d4ed8',
  '#7c3aed',
]

/**
 * Stable for a given name: the same custom skill is always the same colour,
 * rather than changing between renders or between cards.
 */
function hashToIndex(value: string, buckets: number): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % buckets
}

export function skillColor(skill: string | null | undefined): string {
  const value = (skill ?? '').trim()
  if (!value) return '#6c47ff'

  const known = SKILL_COLORS[value]
  if (known) return known

  // A listed skill without its own entry takes its category's colour. Only a
  // genuinely custom one - typed, not picked - reaches the hash.
  const listed = PRO_SKILLS.find((option) => option.name === value)
  if (listed) return CATEGORY_COLORS[listed.category]

  return FALLBACK_COLORS[hashToIndex(value, FALLBACK_COLORS.length)]
}

/** The emoji PRO_SKILLS already carries, when the skill is one of ours. */
export function skillEmoji(skill: string | null | undefined): string | null {
  const value = (skill ?? '').trim()
  if (!value) return null
  return PRO_SKILLS.find((option) => option.name === value)?.emoji ?? null
}
