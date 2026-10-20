/**
 * Pure game rules. Nothing in here touches Firebase or React, so every
 * function is unit-testable and can be applied inside a Firestore
 * transaction against the freshest copy of the player's stats.
 */
import type { InventoryItem, MoodEntry, Quest, QuestType, SkillData, UserStats } from './types';
import { SKILL_KEYS } from './types';
import { stoneById } from './stones';

export const XP = {
  QUEST: 40,
  BOUNTY: 120,
  DAILY_LOG: 50,
  LOG_SKILL: 20,
  HIGH_ENERGY_BONUS: 30,
  MID_ENERGY_BONUS: 20,
  STREAK_BONUS_PER_DAY: 5,
  STREAK_BONUS_CAP: 50,
  SPELL_HEAL: 50,
  SPELL_CALM: 50,
  SPELL_TRANSMUTE: 100,
  SPELL_FAMILIAR: 30,
} as const;

export const LIMITS = {
  QUEST_TITLE: 80,
  HIGHLIGHT: 200,
  NAME: 24,
  THOUGHT: 500,
} as const;

export const LOOT_EVERY_N_QUESTS = 5;

/** Vitals drift down between logs: points per hour, never below the floor. */
export const DECAY_PER_HOUR = 2;
export const DECAY_FLOOR = 5;
export const MAX_INVENTORY = 60;

export const DEFAULT_SKILL: SkillData = { level: 15, xp: 0, xpToNextLevel: 100 };

export const DEFAULT_SKILLS: Record<string, SkillData> = Object.fromEntries(
  SKILL_KEYS.map(k => [k, { ...DEFAULT_SKILL }]),
);

export const LOOT_TABLE: Omit<InventoryItem, 'uid'>[] = [
  { id: 'heal_pot', name: 'Potion of Healing', category: 'POTIONS', description: 'Restores 20 Health (Mood).', value: 50, weight: 0.5, icon: '🍷', effectType: 'RESTORE_HEALTH', effectValue: 20 },
  { id: 'mag_pot', name: 'Potion of Magicka', category: 'POTIONS', description: 'Restores 20 Magicka (Mental Energy).', value: 50, weight: 0.5, icon: '💙', effectType: 'RESTORE_MAGICKA', effectValue: 20 },
  { id: 'sta_pot', name: 'Potion of Stamina', category: 'POTIONS', description: 'Restores 20 Stamina (Physical Energy).', value: 50, weight: 0.5, icon: '💚', effectType: 'RESTORE_STAMINA', effectValue: 20 },
  { id: 'scribe_elixir', name: 'Elixir of the Scribe', category: 'POTIONS', description: 'Grants 100 XP to the Speech skill.', value: 150, weight: 0.5, icon: '🧪', effectType: 'GRANT_XP', effectValue: 100, effectTarget: 'SPEECH' },
  { id: 'work_elixir', name: 'Elixir of Focus', category: 'POTIONS', description: 'Grants 100 XP to the Enchanting skill.', value: 150, weight: 0.5, icon: '✨', effectType: 'GRANT_XP', effectValue: 100, effectTarget: 'ENCHANTING' },
  { id: 'sweetroll', name: 'Sweetroll', category: 'MISC', description: 'A legendary treat. Restores 5 Health.', value: 2, weight: 0.1, icon: '🧁', effectType: 'RESTORE_HEALTH', effectValue: 5 },
  { id: 'akatosh_amulet', name: 'Amulet of Akatosh', category: 'APPAREL', description: 'A holy artifact. Grants 10% more XP global.', value: 500, weight: 1.0, icon: '📿', effectType: 'XP_BOOST', effectValue: 1.1 },
  { id: 'scribe_gauntlets', name: 'Gauntlets of the Scribe', category: 'APPAREL', description: 'Journaling (Speech) grants 25% more XP.', value: 300, weight: 2.0, icon: '🧤', effectType: 'XP_BOOST', effectValue: 1.25, effectTarget: 'SPEECH' },
  { id: 'tome_restoration', name: 'The Book of Ancient Peace', category: 'BOOKS', description: 'Reading it grants 60 XP to Restoration.', value: 120, weight: 1.0, icon: '📖', effectType: 'GRANT_XP', effectValue: 60, effectTarget: 'RESTORATION' },
  { id: 'tome_alteration', name: 'Mystery of Talara', category: 'BOOKS', description: 'Reading it grants 60 XP to Alteration.', value: 120, weight: 1.0, icon: '📕', effectType: 'GRANT_XP', effectValue: 60, effectTarget: 'ALTERATION' },
];

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Default stats for a freshly forged character. */
export function initialStats(name: string): UserStats {
  return {
    name,
    level: 1, xp: 0, xpToNextLevel: 100,
    health: 50, magicka: 70, stamina: 50,
    healthMax: 100, magickaMax: 100, staminaMax: 100,
    skillPoints: 1, pendingLevelUps: 0, race: 'Nord', perks: [],
    skills: { ...DEFAULT_SKILLS },
    inventory: [],
    equippedItemId: null,
    completedQuestCount: 0,
    surgeEndTime: 0,
    slowTimeEndTime: 0,
    zenMode: false,
    trackLocation: true,
    bestStreak: 0,
    questCompletions: {},
    vitalsUpdatedAt: Date.now(),
    standingStone: null,
    stoneChangedAt: 0,
  };
}

function normalizeCounts(v: unknown): Record<string, number> {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
    if (typeof k === 'string' && k.length <= 32 && typeof n === 'number' && Number.isFinite(n) && n >= 0) out[k] = Math.round(n);
  }
  return out;
}

/** Coerce whatever is in Firestore into a well-formed UserStats. Never trusts shape. */
export function normalizeStats(data: Record<string, unknown> | undefined, fallbackName: string): UserStats {
  const d = data ?? {};
  const base = initialStats(fallbackName);
  const rawSkills = (d.skills && typeof d.skills === 'object' ? d.skills : {}) as Record<string, Partial<SkillData>>;
  const skills: Record<string, SkillData> = { ...DEFAULT_SKILLS };
  for (const [key, s] of Object.entries(rawSkills)) {
    if (!s || typeof s !== 'object') continue;
    skills[key] = {
      level: num(s.level, DEFAULT_SKILL.level),
      xp: num(s.xp, 0),
      xpToNextLevel: Math.max(1, num(s.xpToNextLevel, DEFAULT_SKILL.xpToNextLevel)),
    };
  }
  const healthMax = Math.max(1, num(d.healthMax, base.healthMax));
  const magickaMax = Math.max(1, num(d.magickaMax, base.magickaMax));
  const staminaMax = Math.max(1, num(d.staminaMax, base.staminaMax));
  return {
    name: typeof d.name === 'string' && d.name.trim() ? d.name.trim().slice(0, LIMITS.NAME) : base.name,
    level: Math.max(1, Math.round(num(d.level, base.level))),
    xp: Math.max(0, num(d.xp, 0)),
    xpToNextLevel: Math.max(1, num(d.xpToNextLevel, base.xpToNextLevel)),
    health: clamp(num(d.health, base.health), 0, healthMax),
    magicka: clamp(num(d.magicka, base.magicka), 0, magickaMax),
    stamina: clamp(num(d.stamina, base.stamina), 0, staminaMax),
    healthMax, magickaMax, staminaMax,
    skillPoints: Math.max(0, Math.round(num(d.skillPoints, 0))),
    pendingLevelUps: Math.max(0, Math.round(num(d.pendingLevelUps, 0))),
    race: typeof d.race === 'string' ? d.race.slice(0, 24) : base.race,
    perks: Array.isArray(d.perks) ? d.perks.filter((p): p is string => typeof p === 'string').slice(0, 200) : [],
    skills,
    inventory: Array.isArray(d.inventory) ? (d.inventory as InventoryItem[]).filter(i => i && typeof i.uid === 'string').slice(0, MAX_INVENTORY) : [],
    equippedItemId: typeof d.equippedItemId === 'string' ? d.equippedItemId : null,
    completedQuestCount: Math.max(0, Math.round(num(d.completedQuestCount, 0))),
    surgeEndTime: num(d.surgeEndTime, 0),
    slowTimeEndTime: num(d.slowTimeEndTime, 0),
    zenMode: d.zenMode === true,
    trackLocation: d.trackLocation !== false,
    bestStreak: Math.max(0, Math.round(num(d.bestStreak, 0))),
    questCompletions: normalizeCounts(d.questCompletions),
    vitalsUpdatedAt: num(d.vitalsUpdatedAt, 0),
    standingStone: typeof d.standingStone === 'string' && stoneById(d.standingStone) ? d.standingStone : null,
    stoneChangedAt: num(d.stoneChangedAt, 0),
  };
}

export interface XPGrant {
  amount: number;
  skill?: string;
}

export interface XPEvent {
  kind: 'SKILL_UP' | 'LEVEL_UP_AVAILABLE';
  skill?: string;
  level?: number;
}

export function xpMultiplier(stats: UserStats, skill: string | undefined, now: number): number {
  let m = 1;
  if (stats.magicka >= 80) m *= 1.1;                       // Well Rested
  if (stats.surgeEndTime > now) m *= 2;                    // Unrelenting Focus
  if (stats.equippedItemId) {
    const eq = stats.inventory.find(i => i.uid === stats.equippedItemId);
    if (eq?.effectType === 'XP_BOOST' && (!eq.effectTarget || eq.effectTarget === skill)) {
      m *= eq.effectValue ?? 1;
    }
  }
  const stone = stoneById(stats.standingStone);
  if (stone && skill && (stone.skills.length === 0 || (stone.skills as string[]).includes(skill))) m *= stone.multiplier;
  return m;
}

/**
 * Apply one or more XP grants to a stats snapshot. Returns the new stats and the
 * events that happened (skill ups, level ups). Pure: the caller persists.
 */
export function applyXP(stats: UserStats, grants: XPGrant[], now = Date.now()): { stats: UserStats; events: XPEvent[] } {
  const events: XPEvent[] = [];
  const skills: Record<string, SkillData> = { ...stats.skills };
  let xp = stats.xp;
  let xpToNextLevel = stats.xpToNextLevel;
  let pending = stats.pendingLevelUps;

  for (const g of grants) {
    if (!Number.isFinite(g.amount) || g.amount <= 0) continue;
    const amount = Math.floor(g.amount * xpMultiplier(stats, g.skill, now));
    if (g.skill && skills[g.skill]) {
      const s = { ...skills[g.skill] };
      s.xp += amount;
      while (s.xp >= s.xpToNextLevel) {
        s.xp -= s.xpToNextLevel;
        s.level += 1;
        s.xpToNextLevel = Math.floor(s.xpToNextLevel * 1.2);
        xp += s.level * 10;
        events.push({ kind: 'SKILL_UP', skill: g.skill, level: s.level });
      }
      skills[g.skill] = s;
    } else {
      xp += amount;
    }
  }

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    pending += 1;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
    events.push({ kind: 'LEVEL_UP_AVAILABLE' });
  }

  return { stats: { ...stats, skills, xp, xpToNextLevel, pendingLevelUps: pending }, events };
}

/** Attribute change from a daily log. Health <- mood, Stamina <- energy, Magicka <- sleep. */
export function attributesFromLog(stats: UserStats, mood: number, energy: number, sleep: number): Pick<UserStats, 'health' | 'magicka' | 'stamina'> {
  const m = clamp(mood, 1, 10), e = clamp(energy, 1, 10), s = clamp(sleep, 0, 24);
  return {
    health: clamp(Math.round(m * 10 * (stats.healthMax / 100)), 0, stats.healthMax),
    stamina: clamp(Math.round(e * 10 * (stats.staminaMax / 100)), 0, stats.staminaMax),
    magicka: clamp(Math.round(Math.min(s, 10) * 10 * (stats.magickaMax / 100)), 0, stats.magickaMax),
  };
}

/** XP grants for a daily log (before streak bonus). */
export function logGrants(energy: number): XPGrant[] {
  const grants: XPGrant[] = [
    { amount: XP.DAILY_LOG },
    { amount: XP.LOG_SKILL, skill: 'RESTORATION' },
    { amount: XP.LOG_SKILL, skill: 'SPEECH' },
    { amount: XP.LOG_SKILL, skill: 'ALTERATION' },
  ];
  if (energy >= 8) grants.push({ amount: XP.HIGH_ENERGY_BONUS, skill: 'TWO-HANDED' });
  else if (energy >= 5) grants.push({ amount: XP.MID_ENERGY_BONUS, skill: 'ONE-HANDED' });
  return grants;
}

export function streakBonus(streak: number): number {
  return Math.min(XP.STREAK_BONUS_CAP, Math.max(0, streak - 1) * XP.STREAK_BONUS_PER_DAY);
}

export function rollLoot(random = Math.random): InventoryItem {
  const template = LOOT_TABLE[Math.floor(random() * LOOT_TABLE.length)];
  return { ...template, uid: newUid(random) };
}

export function newUid(random = Math.random): string {
  const bytes = new Array(12).fill(0).map(() => Math.floor(random() * 36).toString(36));
  return bytes.join('');
}

export function computeActiveEffects(stats: UserStats, now = Date.now()) {
  const effects: { id: string; name: string; description: string; icon: string }[] = [];
  if (stats.magicka >= 80) effects.push({ id: 'well_rested', name: 'Well Rested', description: 'Skills increase 10% faster.', icon: '🌙' });
  if (stats.health >= 80) effects.push({ id: 'heroic', name: 'Heroic Spirit', description: 'Increased mental fortitude.', icon: '⚔️' });
  if (stats.stamina >= 80) effects.push({ id: 'vitality', name: 'Vitality', description: 'Stamina regenerates faster.', icon: '⚡' });
  if (stats.surgeEndTime > now) effects.push({ id: 'focus_surge', name: 'Focus Surge', description: 'Quests grant double XP.', icon: '🔥' });
  if (stats.slowTimeEndTime > now) effects.push({ id: 'slow_time', name: 'Slow Time', description: 'Notifications are paused.', icon: '⏳' });
  if (stats.zenMode) effects.push({ id: 'zen_mode', name: 'Zen Mode', description: 'HUD is hidden.', icon: '🧘' });
  if (stats.equippedItemId) {
    const eq = stats.inventory.find(i => i.uid === stats.equippedItemId);
    if (eq) effects.push({ id: eq.id, name: eq.name, description: eq.description, icon: '✨' });
  }
  return effects;
}

/** Local-calendar day key, e.g. 2026-10-20. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Monday-based week key, e.g. 2026-W43. */
export function weekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return `W${dayKey(d)}`;
}

/**
 * Whether a quest currently counts as done. Dailies reset at local midnight and
 * bounties on Monday, without needing a write: a daily completed yesterday is
 * simply not done today.
 */
export function isQuestDone(quest: Pick<Quest, 'type' | 'completed' | 'lastCompleted'>, now = new Date()): boolean {
  if (!quest.completed) return false;
  if (quest.type === 'one-off') return true;
  if (!quest.lastCompleted) return false;
  const then = quest.lastCompleted.toDate();
  return quest.type === 'daily' ? dayKey(then) === dayKey(now) : weekKey(then) === weekKey(now);
}

/**
 * Vitals drift down since they were last set. A document that has never been
 * stamped (legacy players) does not decay until its next write.
 */
export function applyDecay(stats: UserStats, now = Date.now()): UserStats {
  if (!stats.vitalsUpdatedAt || now <= stats.vitalsUpdatedAt) return stats;
  const hours = (now - stats.vitalsUpdatedAt) / 3_600_000;
  const drop = hours * DECAY_PER_HOUR;
  if (drop < 0.5) return stats;
  const dec = (v: number) => Math.max(Math.min(v, DECAY_FLOOR), Math.round(v - drop));
  return { ...stats, health: dec(stats.health), magicka: dec(stats.magicka), stamina: dec(stats.stamina), vitalsUpdatedAt: now };
}

const TYPE_ORDER: Record<QuestType, number> = { daily: 0, weekly: 1, 'one-off': 2 };

/**
 * Consecutive days (ending today or yesterday) with at least one log entry.
 * Entries may be in any order.
 */
export function computeStreak(entries: Pick<MoodEntry, 'timestamp'>[], now = new Date()): number {
  const days = new Set(entries.map(e => dayKey(e.timestamp.toDate())));
  if (days.size === 0) return 0;
  let cursor = now;
  if (!days.has(dayKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface WeekSummary { logs: number; mood: number | null; energy: number | null; sleep: number | null }

/** Averages over the last `days` days and the `days` before that, for trend arrows. */
export function periodSummary(entries: Pick<MoodEntry, 'timestamp' | 'mood' | 'energy' | 'sleep'>[], days = 7, now = new Date()): { current: WeekSummary; previous: WeekSummary } {
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  const cut1 = addDays(end, -days); const cut2 = addDays(end, -2 * days);
  const summarise = (list: typeof entries): WeekSummary => {
    if (list.length === 0) return { logs: 0, mood: null, energy: null, sleep: null };
    const avg = (f: (e: typeof entries[number]) => number) => Math.round((list.reduce((a, e) => a + f(e), 0) / list.length) * 10) / 10;
    return { logs: list.length, mood: avg(e => e.mood), energy: avg(e => e.energy), sleep: avg(e => e.sleep) };
  };
  const cur = entries.filter(e => { const t = e.timestamp.toDate(); return t > cut1 && t <= end; });
  const prev = entries.filter(e => { const t = e.timestamp.toDate(); return t > cut2 && t <= cut1; });
  return { current: summarise(cur), previous: summarise(prev) };
}

export function hasLoggedToday(entries: Pick<MoodEntry, 'timestamp'>[], now = new Date()): boolean {
  const today = dayKey(now);
  return entries.some(e => dayKey(e.timestamp.toDate()) === today);
}

export function sortQuests(list: Quest[], now = new Date()): Quest[] {
  return [...list].sort((a, b) => {
    const da = isQuestDone(a, now) ? 1 : 0;
    const db = isQuestDone(b, now) ? 1 : 0;
    if (da !== db) return da - db;
    if (a.type !== b.type) return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    return a.title.localeCompare(b.title);
  });
}
