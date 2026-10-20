import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  applyXP, attributesFromLog, computeStreak, hasLoggedToday, initialStats,
  isQuestDone, normalizeStats, rollLoot, sortQuests, streakBonus, xpMultiplier,
} from './rules';
import type { Quest } from './types';

const ts = (d: Date) => Timestamp.fromDate(d);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12); return d; };

describe('applyXP', () => {
  it('adds character XP and banks a level up when the bar fills', () => {
    const s = initialStats('X');
    const { stats, events } = applyXP(s, [{ amount: 120 }], 0);
    expect(stats.xp).toBe(20);
    expect(stats.xpToNextLevel).toBe(150);
    expect(stats.pendingLevelUps).toBe(1);
    expect(events).toEqual([{ kind: 'LEVEL_UP_AVAILABLE' }]);
  });

  it('levels a skill, carries over XP and rewards character XP', () => {
    const s = initialStats('X');
    const { stats, events } = applyXP(s, [{ amount: 130, skill: 'SPEECH' }], 0);
    expect(stats.skills.SPEECH.level).toBe(16);
    expect(stats.skills.SPEECH.xp).toBe(30);
    expect(stats.skills.SPEECH.xpToNextLevel).toBe(120);
    expect(stats.xp).toBe(160 - 100); // 16 * 10 character XP overflowed the 100 bar
    expect(events.map(e => e.kind)).toEqual(['SKILL_UP', 'LEVEL_UP_AVAILABLE']);
  });

  it('applies several grants against the same snapshot without losing any', () => {
    const s = initialStats('X');
    const { stats } = applyXP(s, [{ amount: 10 }, { amount: 10 }, { amount: 10 }], 0);
    expect(stats.xp).toBe(30);
  });

  it('ignores non-positive or non-finite amounts', () => {
    const s = initialStats('X');
    const { stats } = applyXP(s, [{ amount: -5 }, { amount: NaN }, { amount: 0 }], 0);
    expect(stats.xp).toBe(0);
  });

  it('respects multipliers: well rested, surge and equipped boosts stack', () => {
    const s = { ...initialStats('X'), magicka: 90, surgeEndTime: 10_000 };
    s.inventory = [{ uid: 'a', id: 'akatosh_amulet', name: 'Amulet', category: 'APPAREL', description: '', value: 1, weight: 1, icon: '', effectType: 'XP_BOOST', effectValue: 1.1 }];
    s.equippedItemId = 'a';
    expect(xpMultiplier(s, undefined, 0)).toBeCloseTo(1.1 * 2 * 1.1);
    expect(xpMultiplier({ ...s, surgeEndTime: 0 }, undefined, 0)).toBeCloseTo(1.21);
  });

  it('targeted boosts only apply to their skill', () => {
    const s = initialStats('X');
    s.inventory = [{ uid: 'g', id: 'scribe_gauntlets', name: 'G', category: 'APPAREL', description: '', value: 1, weight: 1, icon: '', effectType: 'XP_BOOST', effectValue: 1.25, effectTarget: 'SPEECH' }];
    s.equippedItemId = 'g';
    expect(xpMultiplier(s, 'SPEECH', 0)).toBe(1.25);
    expect(xpMultiplier(s, 'SMITHING', 0)).toBe(1);
  });
});

describe('normalizeStats', () => {
  it('fills defaults for a missing document', () => {
    const s = normalizeStats(undefined, 'HERO');
    expect(s.name).toBe('HERO');
    expect(Object.keys(s.skills)).toHaveLength(8);
    expect(s.trackLocation).toBe(true);
  });

  it('keeps zero health instead of resetting it', () => {
    expect(normalizeStats({ health: 0 }, 'H').health).toBe(0);
  });

  it('clamps and repairs malformed values', () => {
    const s = normalizeStats({ health: 9999, healthMax: 120, level: 'nope', perks: ['a', 1, null], skills: { SPEECH: { level: 20 } } }, 'H');
    expect(s.health).toBe(120);
    expect(s.level).toBe(1);
    expect(s.perks).toEqual(['a']);
    expect(s.skills.SPEECH).toEqual({ level: 20, xp: 0, xpToNextLevel: 100 });
  });
});

describe('attributesFromLog', () => {
  it('scales attributes to the player maxima', () => {
    const s = { ...initialStats('X'), healthMax: 150 };
    const a = attributesFromLog(s, 10, 5, 12);
    expect(a.health).toBe(150);
    expect(a.stamina).toBe(50);
    expect(a.magicka).toBe(100);
  });
});

describe('streaks', () => {
  it('counts consecutive days ending today', () => {
    const entries = [0, 1, 2, 4].map(n => ({ timestamp: ts(daysAgo(n)) }));
    expect(computeStreak(entries)).toBe(3);
  });
  it('still counts if today is not logged yet', () => {
    const entries = [1, 2].map(n => ({ timestamp: ts(daysAgo(n)) }));
    expect(computeStreak(entries)).toBe(2);
  });
  it('is zero when the chain is broken', () => {
    expect(computeStreak([{ timestamp: ts(daysAgo(3)) }])).toBe(0);
    expect(computeStreak([])).toBe(0);
  });
  it('bonus grows with streak and is capped', () => {
    expect(streakBonus(1)).toBe(0);
    expect(streakBonus(3)).toBe(10);
    expect(streakBonus(100)).toBe(50);
  });
  it('hasLoggedToday', () => {
    expect(hasLoggedToday([{ timestamp: ts(daysAgo(0)) }])).toBe(true);
    expect(hasLoggedToday([{ timestamp: ts(daysAgo(1)) }])).toBe(false);
  });
});

describe('quests', () => {
  const base: Quest = { id: 'q', title: 'T', description: '', type: 'daily', skill: 'SPEECH', completed: true };
  it('a daily completed yesterday is not done today', () => {
    expect(isQuestDone({ ...base, lastCompleted: ts(daysAgo(1)) })).toBe(false);
    expect(isQuestDone({ ...base, lastCompleted: ts(daysAgo(0)) })).toBe(true);
  });
  it('a one-off stays done', () => {
    expect(isQuestDone({ ...base, type: 'one-off', lastCompleted: ts(daysAgo(30)) })).toBe(true);
  });
  it('sorts undone first, dailies before side quests', () => {
    const list: Quest[] = [
      { ...base, id: 'a', title: 'Z', type: 'one-off', completed: false },
      { ...base, id: 'b', title: 'A', type: 'daily', completed: false },
      { ...base, id: 'c', title: 'M', type: 'one-off', completed: true },
    ];
    expect(sortQuests(list).map(q => q.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('loot', () => {
  it('rolls an item with a unique uid', () => {
    const a = rollLoot(() => 0.1);
    const b = rollLoot(() => 0.9);
    expect(a.uid).not.toBe(b.uid);
    expect(a.name).toBeTruthy();
  });
});

describe('normalizeStats on legacy documents', () => {
  it('clamps a long name and non-integer counters so the rules accept the rewrite', () => {
    const s = normalizeStats({ name: 'A-VERY-LONG-EMAIL-PREFIX-BEYOND-LIMITS', level: 3.0000001, completedQuestCount: 4.9, race: 'X'.repeat(60) }, 'H');
    expect(s.name.length).toBeLessThanOrEqual(24);
    expect(Number.isInteger(s.level)).toBe(true);
    expect(s.completedQuestCount).toBe(5);
    expect(s.race.length).toBeLessThanOrEqual(24);
  });
});
