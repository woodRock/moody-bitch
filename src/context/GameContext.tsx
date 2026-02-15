import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebaseConfig';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';

interface SkillData {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface ActiveEffect {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface InventoryItem {
  uid: string; // Unique instance ID
  id: string; // Template ID
  name: string;
  category: 'APPAREL' | 'POTIONS' | 'BOOKS' | 'MISC';
  description: string;
  value: number;
  weight: number;
  icon: string;
  effectType?: 'RESTORE_HEALTH' | 'RESTORE_MAGICKA' | 'RESTORE_STAMINA' | 'GRANT_XP';
  effectValue?: number;
  effectTarget?: string;
}

interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  health: number;
  magicka: number;
  stamina: number;
  skillPoints: number;
  race: string;
  perks: string[];
  skills: { [key: string]: SkillData };
  inventory: InventoryItem[];
  completedQuestCount: number;
}

interface GameContextType {
  stats: UserStats;
  notification: { title: string; subtitle: string } | null;
  activeEffects: ActiveEffect[];
  addXP: (amount: number, skillName?: string) => void;
  updateAttributes: (mood: number, energy: number, sleep: number) => void;
  notify: (title: string, subtitle: string) => void;
  spendSkillPoint: (perkId: string) => void;
  castSpell: (cost: number, spellName: string) => boolean;
  completeQuest: (skillName: string) => void;
  useItem: (item: InventoryItem) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

const DEFAULT_SKILLS = {
  RESTORATION: { level: 15, xp: 0, xpToNextLevel: 100 },
  ENCHANTING: { level: 15, xp: 0, xpToNextLevel: 100 },
  SMITHING: { level: 15, xp: 0, xpToNextLevel: 100 },
  SPEECH: { level: 15, xp: 0, xpToNextLevel: 100 },
  ALCHEMY: { level: 15, xp: 0, xpToNextLevel: 100 },
  'ONE-HANDED': { level: 15, xp: 0, xpToNextLevel: 100 },
  'TWO-HANDED': { level: 15, xp: 0, xpToNextLevel: 100 },
  ALTERATION: { level: 15, xp: 0, xpToNextLevel: 100 },
};

const LOOT_TABLE: Omit<InventoryItem, 'uid'>[] = [
  { id: 'heal_pot', name: 'Potion of Healing', category: 'POTIONS', description: 'Restores 20 Health (Mood).', value: 50, weight: 0.5, icon: '🍷', effectType: 'RESTORE_HEALTH', effectValue: 20 },
  { id: 'mag_pot', name: 'Potion of Magicka', category: 'POTIONS', description: 'Restores 20 Magicka (Mental Energy).', value: 50, weight: 0.5, icon: '💙', effectType: 'RESTORE_MAGICKA', effectValue: 20 },
  { id: 'sta_pot', name: 'Potion of Stamina', category: 'POTIONS', description: 'Restores 20 Stamina (Physical Energy).', value: 50, weight: 0.5, icon: '💚', effectType: 'RESTORE_STAMINA', effectValue: 20 },
  { id: 'scribe_elixir', name: 'Elixir of the Scribe', category: 'POTIONS', description: 'Grants 100 XP to the Speech skill.', value: 150, weight: 0.5, icon: '🧪', effectType: 'GRANT_XP', effectValue: 100, effectTarget: 'SPEECH' },
  { id: 'work_elixir', name: 'Elixir of Focus', category: 'POTIONS', description: 'Grants 100 XP to the Enchanting skill.', value: 150, weight: 0.5, icon: '✨', effectType: 'GRANT_XP', effectValue: 100, effectTarget: 'ENCHANTING' },
  { id: 'sweetroll', name: 'Sweetroll', category: 'MISC', description: 'A legendary treat. Restores 5 Health.', value: 2, weight: 0.1, icon: '🧁', effectType: 'RESTORE_HEALTH', effectValue: 5 },
];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notification, setNotification] = useState<{ title: string; subtitle: string } | null>(null);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [stats, setStats] = useState<UserStats>({
    level: 1, xp: 0, xpToNextLevel: 100,
    health: 50, magicka: 50, stamina: 50,
    skillPoints: 0, race: 'Nord', perks: [],
    skills: DEFAULT_SKILLS,
    inventory: [],
    completedQuestCount: 0
  });

  const notify = (title: string, subtitle: string) => {
    setNotification({ title, subtitle });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const docRef = doc(db, 'userStats', uid);
    return onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentSkills = data.skills || {};
        const updatedSkills = { ...DEFAULT_SKILLS, ...currentSkills };
        
        const effects: ActiveEffect[] = [];
        if (data.magicka >= 80) effects.push({ id: 'well_rested', name: 'Well Rested', description: 'Skills increase 10% faster.', icon: '🌙' });
        if (data.health >= 80) effects.push({ id: 'heroic', name: 'Heroic Spirit', description: 'Increased mental fortitude.', icon: '⚔️' });
        if (data.stamina >= 80) effects.push({ id: 'vitality', name: 'Vitality', description: 'Stamina regenerates faster.', icon: '⚡' });
        setActiveEffects(effects);

        setStats({
          level: data.level || 1,
          xp: data.xp || 0,
          xpToNextLevel: data.xpToNextLevel || 100,
          health: data.health || 50,
          magicka: data.magicka || 50,
          stamina: data.stamina || 50,
          skillPoints: data.skillPoints || 0,
          race: data.race || 'Nord',
          perks: data.perks || [],
          skills: updatedSkills,
          inventory: data.inventory || [],
          completedQuestCount: data.completedQuestCount || 0
        });
      } else {
        const initialStats = {
          level: 1, xp: 0, xpToNextLevel: 100,
          health: 50, magicka: 70, stamina: 50,
          skillPoints: 1, race: 'Nord', perks: [],
          skills: DEFAULT_SKILLS,
          inventory: [],
          completedQuestCount: 0
        };
        setDoc(docRef, initialStats);
      }
    });
  }, [currentUser]);

  const addXP = async (amount: number, skillName?: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    let multiplier = activeEffects.some(e => e.id === 'well_rested') ? 1.1 : 1.0;
    const finalAmount = Math.floor(amount * multiplier);

    let updates: any = {};
    if (skillName && stats.skills[skillName]) {
      let s = { ...stats.skills[skillName] };
      s.xp += finalAmount;
      if (s.xp >= s.xpToNextLevel) {
        s.xp -= s.xpToNextLevel;
        s.level += 1;
        s.xpToNextLevel = Math.floor(s.xpToNextLevel * 1.2);
        notify("SKILL INCREASED", `${skillName} TO ${s.level}`);
        
        let charXP = stats.xp + (s.level * 10);
        let charLevel = stats.level;
        let charXPNext = stats.xpToNextLevel;
        let sp = stats.skillPoints;

        if (charXP >= charXPNext) {
          charXP -= charXPNext;
          charLevel += 1;
          sp += 1;
          charXPNext = Math.floor(charXPNext * 1.5);
          notify("LEVEL UP", `LEVEL ${charLevel}`);
        }
        updates.xp = charXP;
        updates.level = charLevel;
        updates.xpToNextLevel = charXPNext;
        updates.skillPoints = sp;
      }
      updates[`skills.${skillName}`] = s;
    } else {
      updates.xp = stats.xp + finalAmount;
    }
    await updateDoc(doc(db, 'userStats', uid), updates);
  };

  const completeQuest = async (skillName: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const newCount = stats.completedQuestCount + 1;
    let updates: any = { completedQuestCount: newCount };

    if (newCount % 5 === 0) {
      const template = LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)];
      const newItem: InventoryItem = { ...template, uid: Math.random().toString(36).substr(2, 9) };
      updates.inventory = arrayUnion(newItem);
      notify("NEW ITEM ACQUIRED", newItem.name.toUpperCase());
    }

    await updateDoc(doc(db, 'userStats', uid), updates);
    addXP(40, skillName);
  };

  const useItem = async (item: InventoryItem) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    
    const docRef = doc(db, 'userStats', uid);
    let updates: any = {
      inventory: stats.inventory.filter(i => i.uid !== item.uid)
    };

    if (item.effectType === 'RESTORE_HEALTH') updates.health = Math.min(stats.health + (item.effectValue || 0), 100);
    if (item.effectType === 'RESTORE_MAGICKA') updates.magicka = Math.min(stats.magicka + (item.effectValue || 0), 100);
    if (item.effectType === 'RESTORE_STAMINA') updates.stamina = Math.min(stats.stamina + (item.effectValue || 0), 100);
    
    await updateDoc(docRef, updates);
    
    if (item.effectType === 'GRANT_XP') {
      addXP(item.effectValue || 0, item.effectTarget);
    }

    notify("ITEM USED", item.name.toUpperCase());
  };

  const castSpell = (cost: number, spellName: string): boolean => {
    if (stats.magicka < cost) {
      notify("INSUFFICIENT MAGICKA", "Rest to recover your spirit.");
      return false;
    }
    if (!currentUser) return false;
    const uid = currentUser.uid;
    const docRef = doc(db, 'userStats', uid);
    updateDoc(docRef, { magicka: stats.magicka - cost });
    notify("SPELL CAST", spellName.toUpperCase());
    return true;
  };

  const spendSkillPoint = async (perkId: string) => {
    if (!currentUser || stats.skillPoints <= 0 || stats.perks.includes(perkId)) return;
    const uid = currentUser.uid;
    const docRef = doc(db, 'userStats', uid);
    await updateDoc(docRef, {
      skillPoints: stats.skillPoints - 1,
      perks: arrayUnion(perkId)
    });
    notify("PERK UNLOCKED", perkId.split('_')[0].toUpperCase());
  };

  const updateAttributes = async (mood: number, energy: number, sleep: number) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const docRef = doc(db, 'userStats', uid);
    await updateDoc(docRef, {
      health: mood * 10,
      magicka: Math.min(sleep * 10, 100),
      stamina: energy * 10
    });
    addXP(20, 'RESTORATION');
    addXP(20, 'SPEECH');
    addXP(20, 'ALTERATION');
    if (energy >= 8) addXP(30, 'TWO-HANDED');
    else if (energy >= 5) addXP(20, 'ONE-HANDED');
  };

  return (
    <GameContext.Provider value={{ stats, notification, activeEffects, addXP, updateAttributes, notify, spendSkillPoint, castSpell, completeQuest, useItem }}>
      {children}
    </GameContext.Provider>
  );
};
