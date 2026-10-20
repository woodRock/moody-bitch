import type { Constellation, Perk } from '../data/constellations';
import type { UserStats } from './types';

/** Completed quests in the constellation's skill needed for the perk at this index. */
export function perkRequirement(index: number): number {
  return 1 + index * 3;
}

export interface PerkStatus {
  owned: boolean;
  /** Linked to an unlocked star (or the root star). */
  linked: boolean;
  have: number;
  need: number;
  /** Everything but the point is satisfied. */
  available: boolean;
}

/**
 * A perk is earned, not bought: it needs a point, a path through the
 * constellation, and enough completed quests in that skill as evidence.
 */
export function perkStatus(con: Constellation, perk: Perk, stats: UserStats): PerkStatus {
  const idx = con.perks.findIndex(p => p.id === perk.id);
  const owned = stats.perks.includes(perk.id);
  const linked = idx === 0 || con.lines.some(([s, e]) =>
    (e === idx && stats.perks.includes(con.perks[s].id)) || (s === idx && stats.perks.includes(con.perks[e].id)));
  const have = stats.questCompletions[con.skillKey] ?? 0;
  const need = perkRequirement(idx);
  return { owned, linked, have, need, available: !owned && linked && have >= need };
}

/** Kept for callers that only need the constellation path check. */
export function canUnlock(con: Constellation, perkId: string, owned: string[]): boolean {
  const idx = con.perks.findIndex(p => p.id === perkId);
  if (idx === 0) return true;
  return con.lines.some(([s, e]) => (e === idx && owned.includes(con.perks[s].id)) || (s === idx && owned.includes(con.perks[e].id)));
}
