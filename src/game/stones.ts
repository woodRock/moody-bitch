import type { SkillKey } from './types';

export type StoneId = 'warrior' | 'mage' | 'thief' | 'lover';

export interface StandingStone {
  id: StoneId;
  name: string;
  description: string;
  /** Skills boosted; empty means every skill. */
  skills: SkillKey[];
  multiplier: number;
  icon: string;
}

export const STONES: StandingStone[] = [
  { id: 'warrior', name: 'The Warrior Stone', description: 'Those under the sign of the Warrior learn combat skills 20% faster.', skills: ['ONE-HANDED', 'TWO-HANDED', 'SMITHING'], multiplier: 1.2, icon: '⚔️' },
  { id: 'mage', name: 'The Mage Stone', description: 'Those under the sign of the Mage learn magic skills 20% faster.', skills: ['ALTERATION', 'RESTORATION', 'ENCHANTING'], multiplier: 1.2, icon: '🔮' },
  { id: 'thief', name: 'The Thief Stone', description: 'Those under the sign of the Thief learn stealth skills 20% faster.', skills: ['SPEECH', 'ALCHEMY'], multiplier: 1.2, icon: '🗝️' },
  { id: 'lover', name: 'The Lover Stone', description: 'Those under the sign of the Lover learn all skills 10% faster.', skills: [], multiplier: 1.1, icon: '💞' },
];

/** A stone may be changed once every seven days. */
export const STONE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export const stoneById = (id: string | null | undefined) => STONES.find(s => s.id === id) ?? null;
