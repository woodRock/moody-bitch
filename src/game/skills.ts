import type { SkillKey } from './types';

/** What each lore skill stands for in real life. Shown quietly beside the lore name. */
export const SKILL_MEANING: Record<SkillKey, string> = {
  RESTORATION: 'rest & recovery',
  ENCHANTING: 'work & focus',
  SMITHING: 'self-care & hygiene',
  SPEECH: 'relationships & honesty',
  ALCHEMY: 'food & nourishment',
  'ONE-HANDED': 'daily movement',
  'TWO-HANDED': 'hard training',
  ALTERATION: 'mindfulness',
};

export const skillMeaning = (key: string): string => (SKILL_MEANING as Record<string, string>)[key] ?? '';

/** The three vitals and the real-life measure each one tracks. */
export const VITAL_MEANING = { health: 'mood', magicka: 'rest', stamina: 'energy' } as const;
