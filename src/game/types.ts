import type { Timestamp } from 'firebase/firestore';

export interface SkillData {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export type SkillKey =
  | 'RESTORATION' | 'ENCHANTING' | 'SMITHING' | 'SPEECH'
  | 'ALCHEMY' | 'ONE-HANDED' | 'TWO-HANDED' | 'ALTERATION';

export const SKILL_KEYS: SkillKey[] = [
  'RESTORATION', 'ENCHANTING', 'SMITHING', 'SPEECH',
  'ALCHEMY', 'ONE-HANDED', 'TWO-HANDED', 'ALTERATION',
];

export type ItemCategory = 'APPAREL' | 'POTIONS' | 'BOOKS' | 'MISC';
export type ItemEffect = 'RESTORE_HEALTH' | 'RESTORE_MAGICKA' | 'RESTORE_STAMINA' | 'GRANT_XP' | 'XP_BOOST';

export interface InventoryItem {
  uid: string;
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  value: number;
  weight: number;
  icon: string;
  effectType?: ItemEffect;
  effectValue?: number;
  effectTarget?: string;
}

export interface ActiveEffect {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type Attribute = 'health' | 'magicka' | 'stamina';

export interface UserStats {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  health: number;
  magicka: number;
  stamina: number;
  healthMax: number;
  magickaMax: number;
  staminaMax: number;
  skillPoints: number;
  pendingLevelUps: number;
  race: string;
  perks: string[];
  skills: Record<string, SkillData>;
  inventory: InventoryItem[];
  equippedItemId: string | null;
  completedQuestCount: number;
  surgeEndTime: number;
  slowTimeEndTime: number;
  zenMode: boolean;
  /** Whether quest completions and logs record the player's location on the Journey Map. */
  trackLocation: boolean;
  /** Longest run of consecutive days with a log entry. */
  bestStreak: number;
}

export type QuestType = 'daily' | 'one-off';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  skill: string;
  completed: boolean;
  lastCompleted?: Timestamp;
  createdAt?: Timestamp;
}

export interface MoodEntry {
  id: string;
  mood: number;
  energy: number;
  sleep: number;
  highlights: string[];
  timestamp: Timestamp;
}

export interface Notification {
  id: number;
  title: string;
  subtitle: string;
}
