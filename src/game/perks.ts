import type { Constellation } from '../data/constellations';

/** Whether a perk may be unlocked: the root star, or any star linked to an unlocked one. */
export function canUnlock(con: Constellation, perkId: string, owned: string[]): boolean {
  const idx = con.perks.findIndex(p => p.id === perkId);
  if (idx === 0) return true;
  return con.lines.some(([s, e]) => (e === idx && owned.includes(con.perks[s].id)) || (s === idx && owned.includes(con.perks[e].id)));
}
