import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useLatestRef } from '../hooks/useLatestRef';
import { useSound } from './SoundContext';
import { db } from '../firebaseConfig';
import type { ActiveEffect, Attribute, InventoryItem, Notification, QuestType, UserStats } from '../game/types';
import { STONE_COOLDOWN_MS, stoneById } from '../game/stones';
import { WISDOM_QUOTES } from '../game/spells';
import {
  applyDecay, applyXP, attributesFromLog, computeActiveEffects, initialStats, LIMITS, logGrants,
  LOOT_EVERY_N_QUESTS, MAX_INVENTORY, normalizeStats, rollLoot, SHOUT_COOLDOWN_MS, streakBonus, XP,
} from '../game/rules';
import type { XPEvent, XPGrant } from '../game/rules';

export type { ActiveEffect, InventoryItem } from '../game/types';

interface WorldMessage { id: string; text: string }

export interface UIState {
  isPauseMenuOpen: boolean;
  isMenuOpen: boolean;
  /** Number of modal layers currently open; keyboard shortcuts pause while > 0. */
  modalDepth: number;
  /** The level-up screen is showing; shortcuts and other overlays wait. */
  levelUpShowing: boolean;
  pauseTab: 'QUESTS' | 'STATS' | 'JOURNAL' | 'SYSTEM';
}

interface GameContextType {
  stats: UserStats;
  statsLoaded: boolean;
  notification: Notification | null;
  worldMessages: WorldMessage[];
  activeEffects: ActiveEffect[];
  ui: UIState;
  setUI: (updates: Partial<UIState>) => void;
  /** Modals call this with +1 on open and -1 on close so global shortcuts pause. */
  bumpModal: (delta: number) => void;
  notify: (title: string, subtitle?: string, opts?: { icon?: string; to?: string }) => void;
  /** Try to use the Voice. Returns false (and says so) if it is still recharging. */
  spendShout: () => Promise<boolean>;
  setOnboarded: () => Promise<void>;
  addWorldMessage: (text: string) => void;
  grantXP: (grants: XPGrant[]) => Promise<void>;
  completeQuest: (skillName: string, type?: QuestType) => Promise<void>;
  /** Restore vitals by an amount (clamped to the maxima). */
  restore: (delta: Partial<Record<Attribute, number>>) => Promise<void>;
  /** Choose a Standing Stone; false if the weekly cooldown has not passed. */
  setStandingStone: (id: string | null) => Promise<boolean>;
  submitLog: (mood: number, energy: number, sleep: number, streak: number) => Promise<void>;
  spendSkillPoint: (perkId: string) => Promise<boolean>;
  castSpell: (cost: number, spellName: string) => Promise<boolean>;
  consumeItem: (item: InventoryItem) => Promise<void>;
  toggleEquip: (uid: string) => Promise<void>;
  advanceLevel: (attribute: Attribute) => Promise<void>;
  updateDisplayName: (newName: string) => Promise<void>;
  updateRace: (newRace: string) => Promise<void>;
  startSurge: (durationMinutes: number) => Promise<void>;
  startSlowTime: (durationMinutes: number) => Promise<void>;
  toggleZenMode: () => Promise<void>;
  setTrackLocation: (on: boolean) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

const NOTIFICATION_MS = 3500;
const WORLD_MESSAGE_MS = 5000;

const fromXP = (r: { stats: UserStats; events: XPEvent[] }) => ({ next: r.stats, events: r.events });

const fallbackName = (email?: string | null) => email?.split('@')[0].toUpperCase().slice(0, LIMITS.NAME) || 'DRAGONBORN';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { playSound } = useSound();
  const [storedStats, setStats] = useState<UserStats>(() => initialStats('DRAGONBORN'));
  // Vitals drift down between logs; re-evaluate once a minute so the bars move on their own.
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const stats = useMemo(() => applyDecay(storedStats, clock), [storedStats, clock]);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [queue, setQueue] = useState<Notification[]>([]);
  const [worldMessages, setWorldMessages] = useState<WorldMessage[]>([]);
  const [ui, setUIState] = useState<UIState>({
    isPauseMenuOpen: false,
    isMenuOpen: false,
    modalDepth: 0,
    levelUpShowing: false,
    pauseTab: 'QUESTS',
  });

  // Refs let async actions read the latest stats without re-creating callbacks.
  const statsRef = useLatestRef(stats);
  const counter = useRef(0);

  const setUI = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => {
      if (updates.isMenuOpen === true && !prev.isMenuOpen) playSound('MENU_OPEN');
      if (updates.isMenuOpen === false && prev.isMenuOpen) playSound('MENU_CLOSE');
      if (updates.isPauseMenuOpen === true && !prev.isPauseMenuOpen) playSound('MENU_OPEN');
      if (updates.isPauseMenuOpen === false && prev.isPauseMenuOpen) playSound('MENU_CLOSE');
      return { ...prev, ...updates };
    });
  }, [playSound]);

  const bumpModal = useCallback((delta: number) => {
    setUIState(prev => ({ ...prev, modalDepth: Math.max(0, prev.modalDepth + delta) }));
  }, []);

  const notify = useCallback((title: string, subtitle = '', opts?: { icon?: string; to?: string }) => {
    if (statsRef.current.slowTimeEndTime > Date.now()) return; // Slow Time silences banners
    counter.current += 1;
    setQueue(q => [...q.slice(-4), { id: counter.current, title, subtitle, ...opts }]);
  }, [statsRef]);

  // Pop the banner queue one at a time.
  const notification = queue[0] ?? null;
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setQueue(q => q.filter(n => n.id !== notification.id)), NOTIFICATION_MS);
    return () => clearTimeout(t);
  }, [notification]);

  const addWorldMessage = useCallback((text: string) => {
    if (statsRef.current.slowTimeEndTime > Date.now()) return;
    counter.current += 1;
    const id = `w${counter.current}`;
    setWorldMessages(prev => [...prev.slice(-3), { id, text }]);
    setTimeout(() => setWorldMessages(prev => prev.filter(m => m.id !== id)), WORLD_MESSAGE_MS);
  }, [statsRef]);

  // Live subscription to the player's stats document.
  useEffect(() => {
    if (!currentUser) {
      setStats(initialStats('DRAGONBORN'));
      setStatsLoaded(false);
      return;
    }
    const docRef = doc(db, 'userStats', currentUser.uid);
    const name = fallbackName(currentUser.email);
    const unsubscribe = onSnapshot(docRef, snap => {
      if (snap.exists()) {
        setStats(normalizeStats(snap.data(), name));
        setStatsLoaded(true);
      } else if (!snap.metadata.fromCache) {
        setDoc(docRef, initialStats(name)).catch(err => console.error('Could not forge character', err));
      }
    }, err => console.error('Stats subscription failed', err));
    return unsubscribe;
  }, [currentUser]);

  const activeEffects = useMemo(() => computeActiveEffects(stats), [stats]);

  const announce = useCallback((events: XPEvent[]) => {
    for (const e of events) {
      if (e.kind === 'SKILL_UP') {
        notify('SKILL INCREASED', `${e.skill} TO ${e.level}`);
        playSound('SKILL_UP');
        addWorldMessage(WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)]);
      } else if (e.kind === 'LEVEL_UP_AVAILABLE') {
        notify('LEVEL UP AVAILABLE', 'Open Skills to Advance');
      }
    }
  }, [notify, playSound, addWorldMessage]);

  /**
   * Run a change against the freshest copy of the stats document. The
   * mutator returns the new stats (or null to abort). Retries on contention.
   */
  const mutate = useCallback(async (
    fn: (current: UserStats) => { next: UserStats; events?: XPEvent[] } | null,
  ): Promise<boolean> => {
    if (!currentUser) return false;
    const docRef = doc(db, 'userStats', currentUser.uid);
    const name = fallbackName(currentUser.email);
    try {
      const events = await runTransaction(db, async tx => {
        const snap = await tx.get(docRef);
        const current = applyDecay(normalizeStats(snap.exists() ? snap.data() : undefined, name), Date.now());
        const result = fn(current);
        if (!result) return null;
        tx.set(docRef, result.next);
        return result.events ?? [];
      });
      if (events === null) return false;
      announce(events);
      return true;
    } catch (err) {
      console.error('The realm rejected the change', err);
      notify('THE REALM RESISTS', 'Change not saved. Check your connection.');
      return false;
    }
  }, [currentUser, announce, notify]);

  const grantXP = useCallback(async (grants: XPGrant[]) => {
    await mutate(cur => fromXP(applyXP(cur, grants)));
  }, [mutate]);

  const completeQuest = useCallback(async (skillName: string, type: QuestType = 'one-off') => {
    playSound('QUEST_COMPLETE');
    let loot: InventoryItem | null = null;
    const bounty = type === 'weekly';
    await mutate(cur => {
      const count = cur.completedQuestCount + 1;
      let inventory = cur.inventory;
      loot = null;
      if ((bounty || count % LOOT_EVERY_N_QUESTS === 0) && inventory.length < MAX_INVENTORY) {
        loot = rollLoot();
        inventory = [...inventory, loot];
      }
      const questCompletions = { ...cur.questCompletions, [skillName]: (cur.questCompletions[skillName] ?? 0) + 1 };
      const { stats: next, events } = applyXP(
        { ...cur, completedQuestCount: count, inventory, questCompletions },
        [{ amount: bounty ? XP.BOUNTY : XP.QUEST, skill: skillName }],
      );
      return { next, events };
    });
    if (bounty) notify('BOUNTY COLLECTED', `+${XP.BOUNTY} ${skillName} XP`);
    if (loot) { const l = loot as InventoryItem; notify('NEW ITEM ACQUIRED', l.name.toUpperCase(), { icon: l.icon, to: '/inventory' }); }
  }, [mutate, notify, playSound]);

  const spendShout = useCallback(async () => {
    const now = Date.now();
    if (statsRef.current.shoutCooldownUntil > now) {
      const s = Math.ceil((statsRef.current.shoutCooldownUntil - now) / 1000);
      notify('THE VOICE IS SPENT', `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} UNTIL IT RETURNS`);
      return false;
    }
    return mutate(cur => cur.shoutCooldownUntil > now ? null : { next: { ...cur, shoutCooldownUntil: now + SHOUT_COOLDOWN_MS } });
  }, [mutate, notify, statsRef]);

  const setOnboarded = useCallback(async () => {
    await mutate(cur => cur.onboarded ? null : { next: { ...cur, onboarded: true } });
  }, [mutate]);

  const restore = useCallback(async (delta: Partial<Record<Attribute, number>>) => {
    await mutate(cur => ({ next: {
      ...cur,
      health: Math.min(cur.healthMax, cur.health + (delta.health ?? 0)),
      magicka: Math.min(cur.magickaMax, cur.magicka + (delta.magicka ?? 0)),
      stamina: Math.min(cur.staminaMax, cur.stamina + (delta.stamina ?? 0)),
      vitalsUpdatedAt: Date.now(),
    } }));
  }, [mutate]);

  const setStandingStone = useCallback(async (id: string | null) => {
    const now = Date.now();
    let blocked = false;
    const ok = await mutate(cur => {
      if (cur.standingStone === id) return null;
      if (cur.standingStone && now - cur.stoneChangedAt < STONE_COOLDOWN_MS) { blocked = true; return null; }
      return { next: { ...cur, standingStone: id, stoneChangedAt: now } };
    });
    if (blocked) {
      const days = Math.ceil((STONE_COOLDOWN_MS - (now - statsRef.current.stoneChangedAt)) / 86_400_000);
      notify('THE STONE RESISTS', `${days} MORE DAY${days === 1 ? '' : 'S'} UNDER THIS SIGN`);
      return false;
    }
    if (ok) {
      const stone = stoneById(id);
      notify(stone ? stone.name.toUpperCase() : 'SIGN RELEASED', stone ? 'ITS BLESSING IS YOURS' : '');
      playSound('SPELL_CAST');
    }
    return ok;
  }, [mutate, notify, playSound, statsRef]);

  const submitLog = useCallback(async (mood: number, energy: number, sleep: number, streak: number) => {
    const bonus = streakBonus(streak);
    await mutate(cur => {
      const grants = logGrants(energy);
      if (bonus > 0) grants.push({ amount: bonus });
      const { stats: next, events } = applyXP(
        { ...cur, ...attributesFromLog(cur, mood, energy, sleep), vitalsUpdatedAt: Date.now(), bestStreak: Math.max(cur.bestStreak, streak) },
        grants,
      );
      return { next, events };
    });
    notify('CHRONICLE SCRIBED', bonus > 0 ? `+${XP.DAILY_LOG + bonus} XP · ${streak} DAY STREAK` : `+${XP.DAILY_LOG} XP`);
    addWorldMessage(WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)]);
  }, [mutate, notify, addWorldMessage]);

  const advanceLevel = useCallback(async (attribute: Attribute) => {
    let newLevel = 0;
    const ok = await mutate(cur => {
      if (cur.pendingLevelUps <= 0) return null;
      newLevel = cur.level + 1;
      const next: UserStats = {
        ...cur,
        level: newLevel,
        pendingLevelUps: cur.pendingLevelUps - 1,
        skillPoints: cur.skillPoints + 1,
      };
      if (attribute === 'health') next.healthMax = cur.healthMax + 10;
      if (attribute === 'magicka') next.magickaMax = cur.magickaMax + 10;
      if (attribute === 'stamina') next.staminaMax = cur.staminaMax + 10;
      return { next };
    });
    if (ok) {
      notify('LEVEL INCREASED', `LEVEL ${newLevel}`);
      playSound('LEVEL_UP');
    }
  }, [mutate, notify, playSound]);

  const spendSkillPoint = useCallback(async (perkId: string) => {
    const ok = await mutate(cur => {
      if (cur.skillPoints <= 0 || cur.perks.includes(perkId)) return null;
      return { next: { ...cur, skillPoints: cur.skillPoints - 1, perks: [...cur.perks, perkId] } };
    });
    if (ok) {
      notify('PERK UNLOCKED', perkId.split('_')[0].toUpperCase());
      playSound('SKILL_UP');
    }
    return ok;
  }, [mutate, notify, playSound]);

  const castSpell = useCallback(async (cost: number, spellName: string) => {
    if (statsRef.current.magicka < cost) {
      notify('INSUFFICIENT MAGICKA', 'Rest to recover your spirit.');
      return false;
    }
    const ok = await mutate(cur => cur.magicka < cost ? null : { next: { ...cur, magicka: cur.magicka - cost, vitalsUpdatedAt: Date.now() } });
    if (ok) {
      notify('SPELL CAST', spellName.toUpperCase());
      playSound('SPELL_CAST');
    } else {
      notify('INSUFFICIENT MAGICKA', 'Rest to recover your spirit.');
    }
    return ok;
  }, [mutate, notify, playSound, statsRef]);

  const consumeItem = useCallback(async (item: InventoryItem) => {
    const ok = await mutate(cur => {
      if (!cur.inventory.some(i => i.uid === item.uid)) return null;
      const next: UserStats = { ...cur, inventory: cur.inventory.filter(i => i.uid !== item.uid) };
      if (next.equippedItemId === item.uid) next.equippedItemId = null;
      const v = item.effectValue ?? 0;
      if (item.effectType === 'RESTORE_HEALTH' || item.effectType === 'RESTORE_MAGICKA' || item.effectType === 'RESTORE_STAMINA') next.vitalsUpdatedAt = Date.now();
      if (item.effectType === 'RESTORE_HEALTH') next.health = Math.min(cur.health + v, cur.healthMax);
      if (item.effectType === 'RESTORE_MAGICKA') next.magicka = Math.min(cur.magicka + v, cur.magickaMax);
      if (item.effectType === 'RESTORE_STAMINA') next.stamina = Math.min(cur.stamina + v, cur.staminaMax);
      if (item.effectType === 'GRANT_XP') return fromXP(applyXP(next, [{ amount: v, skill: item.effectTarget }]));
      return { next };
    });
    if (ok) {
      playSound('ITEM_USE');
      notify('ITEM USED', item.name.toUpperCase());
    }
  }, [mutate, notify, playSound]);

  const toggleEquip = useCallback(async (uid: string) => {
    let equipped = false;
    const ok = await mutate(cur => {
      if (!cur.inventory.some(i => i.uid === uid)) return null;
      equipped = cur.equippedItemId !== uid;
      return { next: { ...cur, equippedItemId: equipped ? uid : null } };
    });
    if (ok) {
      playSound('UI_CLICK');
      notify(equipped ? 'ITEM EQUIPPED' : 'ITEM UNEQUIPPED');
    }
  }, [mutate, notify, playSound]);

  const updateDisplayName = useCallback(async (newName: string) => {
    const name = newName.trim().toUpperCase().slice(0, LIMITS.NAME);
    if (!name) return;
    if (await mutate(cur => ({ next: { ...cur, name } }))) {
      notify('NAME CHANGED', name);
      playSound('UI_CLICK');
    }
  }, [mutate, notify, playSound]);

  const updateRace = useCallback(async (newRace: string) => {
    if (await mutate(cur => ({ next: { ...cur, race: newRace } }))) {
      notify('HERITAGE CHANGED', newRace.toUpperCase());
      playSound('UI_CLICK');
    }
  }, [mutate, notify, playSound]);

  const startSurge = useCallback(async (durationMinutes: number) => {
    const endTime = Date.now() + durationMinutes * 60_000;
    if (await mutate(cur => ({ next: { ...cur, surgeEndTime: endTime } }))) {
      notify('FOCUS SURGE', `${durationMinutes} MIN OF DOUBLE XP`);
      playSound('SPELL_CAST');
    }
  }, [mutate, notify, playSound]);

  const startSlowTime = useCallback(async (durationMinutes: number) => {
    const endTime = Date.now() + durationMinutes * 60_000;
    notify('SLOW TIME', `${durationMinutes} MIN OF NO INTERRUPTIONS`);
    playSound('SPELL_CAST');
    await mutate(cur => ({ next: { ...cur, slowTimeEndTime: endTime } }));
  }, [mutate, notify, playSound]);

  const toggleZenMode = useCallback(async () => {
    let on = false;
    if (await mutate(cur => { on = !cur.zenMode; return { next: { ...cur, zenMode: on } }; })) {
      notify(on ? 'ZEN MODE ACTIVE' : 'ZEN MODE DEACTIVATED');
      playSound('SPELL_CAST');
    }
  }, [mutate, notify, playSound]);

  const setTrackLocation = useCallback(async (on: boolean) => {
    await mutate(cur => ({ next: { ...cur, trackLocation: on } }));
  }, [mutate]);

  const value = useMemo<GameContextType>(() => ({
    stats, statsLoaded, notification, worldMessages, activeEffects, ui, setUI, bumpModal, notify, spendShout, setOnboarded, addWorldMessage,
    grantXP, completeQuest, restore, setStandingStone, submitLog, spendSkillPoint, castSpell, consumeItem, toggleEquip, advanceLevel,
    updateDisplayName, updateRace, startSurge, startSlowTime, toggleZenMode, setTrackLocation,
  }), [
    stats, statsLoaded, notification, worldMessages, activeEffects, ui, setUI, bumpModal, notify, spendShout, setOnboarded, addWorldMessage,
    grantXP, completeQuest, restore, setStandingStone, submitLog, spendSkillPoint, castSpell, consumeItem, toggleEquip, advanceLevel,
    updateDisplayName, updateRace, startSurge, startSlowTime, toggleZenMode, setTrackLocation,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
