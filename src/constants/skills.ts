/**
 * Every skill the picker offers, grouped the way it displays them.
 *
 * The list is a shortcut rather than a vocabulary: profiles.skill is a plain
 * text column and "Other" still writes whatever the user types, so nothing here
 * constrains what a profile can say. What it does constrain is what can be
 * found - a typed trade matches only itself, while a picked one matches the
 * Discover filter, the chip colour and the emoji.
 *
 * Tradie and Driver are kept only because profiles already carry them. They
 * predate the specific trades below and nothing should offer them to a new
 * user, but dropping them would reclassify those profiles as custom skills and
 * quietly cost them their filter and their colour. See LEGACY_SKILLS.
 */

export type SkillCategory =
  | 'Trades'
  | 'Home Services'
  | 'Beauty & Personal Care'
  | 'Automotive'
  | 'Food & Hospitality'
  | 'Technology'
  | 'Creative & Media'
  | 'Health & Wellness'
  | 'Other Professional'

export type SkillOption = {
  name: string
  emoji: string
  category: SkillCategory
}

/** Section order in the picker. */
export const SKILL_CATEGORIES: SkillCategory[] = [
  'Trades',
  'Home Services',
  'Beauty & Personal Care',
  'Automotive',
  'Food & Hospitality',
  'Technology',
  'Creative & Media',
  'Health & Wellness',
  'Other Professional',
]

/**
 * Held by profiles in the wild but never shown as a choice.
 *
 * The picker filters these out; everything else that reads PRO_SKILLS - emoji,
 * colour, the Discover filter - still resolves them.
 */
export const LEGACY_SKILLS = new Set(['Tradie', 'Driver'])

export const PRO_SKILLS: SkillOption[] = [
  // Trades
  { name: 'Electrician', emoji: '⚡', category: 'Trades' },
  { name: 'Plumber', emoji: '🔧', category: 'Trades' },
  { name: 'Carpenter', emoji: '🪚', category: 'Trades' },
  { name: 'Painter', emoji: '🎨', category: 'Trades' },
  { name: 'Tiler', emoji: '🧱', category: 'Trades' },
  { name: 'Bricklayer', emoji: '🏗️', category: 'Trades' },
  { name: 'Plasterer', emoji: '🪣', category: 'Trades' },
  { name: 'Roofer', emoji: '🏠', category: 'Trades' },
  { name: 'Concreter', emoji: '🪨', category: 'Trades' },
  { name: 'Landscaper', emoji: '🌿', category: 'Trades' },
  { name: 'Fencer', emoji: '🚧', category: 'Trades' },
  { name: 'Glazier', emoji: '🪟', category: 'Trades' },
  { name: 'Welder', emoji: '🔥', category: 'Trades' },
  { name: 'Fabricator', emoji: '⚙️', category: 'Trades' },
  { name: 'Cabinet Maker', emoji: '🪑', category: 'Trades' },
  { name: 'Floor Layer', emoji: '🪵', category: 'Trades' },
  { name: 'Insulation Installer', emoji: '🧊', category: 'Trades' },
  { name: 'Waterproofer', emoji: '💧', category: 'Trades' },
  { name: 'Demolition Worker', emoji: '💥', category: 'Trades' },
  { name: 'Excavator Operator', emoji: '🚜', category: 'Trades' },
  { name: 'Tradie', emoji: '🔨', category: 'Trades' },

  // Home Services
  { name: 'Cleaner', emoji: '🧹', category: 'Home Services' },
  { name: 'Deep Cleaner', emoji: '🫧', category: 'Home Services' },
  { name: 'Window Cleaner', emoji: '🧽', category: 'Home Services' },
  { name: 'Pressure Washer', emoji: '💦', category: 'Home Services' },
  { name: 'Gardener', emoji: '🌱', category: 'Home Services' },
  { name: 'Lawn Mower', emoji: '🌾', category: 'Home Services' },
  { name: 'Pool Cleaner', emoji: '🏊', category: 'Home Services' },
  { name: 'Pest Controller', emoji: '🐜', category: 'Home Services' },
  { name: 'Handyman', emoji: '🧰', category: 'Home Services' },
  { name: 'Locksmith', emoji: '🔐', category: 'Home Services' },
  { name: 'Removalist', emoji: '📦', category: 'Home Services' },
  { name: 'Rubbish Remover', emoji: '🗑️', category: 'Home Services' },
  { name: 'Carpet Cleaner', emoji: '🧼', category: 'Home Services' },
  { name: 'Upholstery Cleaner', emoji: '🛋️', category: 'Home Services' },
  { name: 'Curtain Installer', emoji: '🧵', category: 'Home Services' },

  // Beauty & Personal Care
  { name: 'Barber', emoji: '✂️', category: 'Beauty & Personal Care' },
  { name: 'Hairdresser', emoji: '💇', category: 'Beauty & Personal Care' },
  { name: 'Nail Technician', emoji: '💅', category: 'Beauty & Personal Care' },
  { name: 'Makeup Artist', emoji: '💄', category: 'Beauty & Personal Care' },
  { name: 'Eyelash Technician', emoji: '👁️', category: 'Beauty & Personal Care' },
  { name: 'Eyebrow Technician', emoji: '🪞', category: 'Beauty & Personal Care' },
  { name: 'Massage Therapist', emoji: '💆', category: 'Beauty & Personal Care' },
  { name: 'Personal Trainer', emoji: '🏋️', category: 'Beauty & Personal Care' },
  { name: 'Tattoo Artist', emoji: '🖋️', category: 'Beauty & Personal Care' },
  { name: 'Piercing Artist', emoji: '💎', category: 'Beauty & Personal Care' },
  { name: 'Waxing Specialist', emoji: '🪒', category: 'Beauty & Personal Care' },
  { name: 'Skin Care Therapist', emoji: '🧖', category: 'Beauty & Personal Care' },

  // Automotive
  { name: 'Mechanic', emoji: '🛠️', category: 'Automotive' },
  { name: 'Panel Beater', emoji: '🚙', category: 'Automotive' },
  { name: 'Auto Electrician', emoji: '🔌', category: 'Automotive' },
  { name: 'Detailer', emoji: '✨', category: 'Automotive' },
  { name: 'Tow Truck Driver', emoji: '🚛', category: 'Automotive' },
  { name: 'Windscreen Repairer', emoji: '🚘', category: 'Automotive' },
  { name: 'Signwriter', emoji: '🪧', category: 'Automotive' },
  { name: 'Driver', emoji: '🚗', category: 'Automotive' },

  // Food & Hospitality
  { name: 'Chef', emoji: '👨‍🍳', category: 'Food & Hospitality' },
  { name: 'Baker', emoji: '🥖', category: 'Food & Hospitality' },
  { name: 'Caterer', emoji: '🍽️', category: 'Food & Hospitality' },
  { name: 'Barista', emoji: '☕', category: 'Food & Hospitality' },
  { name: 'Private Cook', emoji: '🍳', category: 'Food & Hospitality' },
  { name: 'Meal Prep Specialist', emoji: '🥗', category: 'Food & Hospitality' },

  // Technology
  { name: 'Web Developer', emoji: '💻', category: 'Technology' },
  { name: 'App Developer', emoji: '📱', category: 'Technology' },
  { name: 'IT Support', emoji: '🖥️', category: 'Technology' },
  { name: 'Network Technician', emoji: '🌐', category: 'Technology' },
  { name: 'CCTV Installer', emoji: '📹', category: 'Technology' },
  { name: 'Home Automation Specialist', emoji: '🏡', category: 'Technology' },
  { name: 'Solar Installer', emoji: '☀️', category: 'Technology' },

  // Creative & Media
  { name: 'Photographer', emoji: '📷', category: 'Creative & Media' },
  { name: 'Videographer', emoji: '🎥', category: 'Creative & Media' },
  { name: 'Graphic Designer', emoji: '🖌️', category: 'Creative & Media' },
  { name: 'Copywriter', emoji: '✍️', category: 'Creative & Media' },
  { name: 'Social Media Manager', emoji: '📣', category: 'Creative & Media' },
  { name: 'DJ', emoji: '🎧', category: 'Creative & Media' },
  { name: 'Music Teacher', emoji: '🎵', category: 'Creative & Media' },

  // Health & Wellness
  { name: 'Physiotherapist', emoji: '🦴', category: 'Health & Wellness' },
  { name: 'Chiropractor', emoji: '🦵', category: 'Health & Wellness' },
  { name: 'Nutritionist', emoji: '🥑', category: 'Health & Wellness' },
  { name: 'Yoga Instructor', emoji: '🧘', category: 'Health & Wellness' },
  { name: 'Life Coach', emoji: '🌟', category: 'Health & Wellness' },
  { name: 'Childcare Worker', emoji: '🧸', category: 'Health & Wellness' },
  { name: 'Aged Care Worker', emoji: '👵', category: 'Health & Wellness' },
  { name: 'Disability Support Worker', emoji: '♿', category: 'Health & Wellness' },

  // Other Professional
  { name: 'Accountant', emoji: '📊', category: 'Other Professional' },
  { name: 'Bookkeeper', emoji: '📒', category: 'Other Professional' },
  { name: 'Lawyer', emoji: '⚖️', category: 'Other Professional' },
  { name: 'Mortgage Broker', emoji: '🏦', category: 'Other Professional' },
  { name: 'Real Estate Agent', emoji: '🏘️', category: 'Other Professional' },
  { name: 'Financial Advisor', emoji: '💰', category: 'Other Professional' },
  { name: 'Translator', emoji: '🗣️', category: 'Other Professional' },
  { name: 'Tutor', emoji: '📚', category: 'Other Professional' },
]

/** What the picker offers: everything except the grandfathered names. */
export const SELECTABLE_SKILLS: SkillOption[] = PRO_SKILLS.filter(
  (item) => !LEGACY_SKILLS.has(item.name)
)

/**
 * Skills grouped into the sections the picker renders, in SKILL_CATEGORIES
 * order and with empty sections dropped.
 */
export function skillsByCategory(
  options: SkillOption[] = SELECTABLE_SKILLS
): { category: SkillCategory; data: SkillOption[] }[] {
  return SKILL_CATEGORIES.map((category) => ({
    category,
    data: options.filter((item) => item.category === category),
  })).filter((section) => section.data.length > 0)
}
