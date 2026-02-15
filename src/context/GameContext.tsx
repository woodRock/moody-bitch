import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebaseConfig';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';

interface SkillData {
  level: number;
  xp: number;
  xpToNextLevel: number;
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
  skills: {
    [key: string]: SkillData;
  };
}

interface GameContextType {
  stats: UserStats;
  notification: { title: string; subtitle: string } | null;
  addXP: (amount: number, skillName?: string) => void;
  updateAttributes: (mood: number, energy: number, sleep: number) => void;
  notify: (title: string, subtitle: string) => void;
  spendSkillPoint: (perkId: string) => void;
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

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notification, setNotification] = useState<{ title: string; subtitle: string } | null>(null);
  const [stats, setStats] = useState<UserStats>({
    level: 1, xp: 0, xpToNextLevel: 100,
    health: 50, magicka: 50, stamina: 50,
    skillPoints: 0, race: 'Nord', perks: [],
    skills: DEFAULT_SKILLS
  });

  const notify = (title: string, subtitle: string) => {
    setNotification({ title, subtitle });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (!currentUser) return;
    const docRef = doc(db, 'userStats', currentUser.uid);
    return onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentSkills = data.skills || {};
        
        // Check if any default skills are missing (Migration)
        let needsUpdate = false;
        const updatedSkills = { ...DEFAULT_SKILLS, ...currentSkills };
        
        Object.keys(DEFAULT_SKILLS).forEach(skill => {
          if (!currentSkills[skill]) {
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          await updateDoc(docRef, { skills: updatedSkills });
        }

        setStats({
          ...stats,
          ...data,
          skills: updatedSkills
        } as UserStats);
      } else {
        const initialStats = {
          level: 1, xp: 0, xpToNextLevel: 100,
          health: 50, magicka: 70, stamina: 50,
          skillPoints: 1, race: 'Nord', perks: [],
          skills: DEFAULT_SKILLS
        };
        setDoc(docRef, initialStats);
      }
    });
  }, [currentUser]);

  const addXP = async (amount: number, skillName?: string) => {
    if (!currentUser) return;
    
    let updates: any = {};
    
    if (skillName && stats.skills[skillName]) {
      let s = { ...stats.skills[skillName] };
      s.xp += amount;
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
      let newXP = stats.xp + amount;
      updates.xp = newXP;
    }

    const docRef = doc(db, 'userStats', currentUser.uid);
    await updateDoc(docRef, updates);
  };

  const spendSkillPoint = async (perkId: string) => {
    if (!currentUser || stats.skillPoints <= 0 || stats.perks.includes(perkId)) return;
    const docRef = doc(db, 'userStats', currentUser.uid);
    await updateDoc(docRef, {
      skillPoints: stats.skillPoints - 1,
      perks: arrayUnion(perkId)
    });
    notify("PERK UNLOCKED", perkId.split('_')[0].toUpperCase());
  };

  const updateAttributes = async (mood: number, energy: number, sleep: number) => {
    if (!currentUser) return;
    const docRef = doc(db, 'userStats', currentUser.uid);
    await updateDoc(docRef, {
      health: mood * 10,
      magicka: Math.min(sleep * 10, 100),
      stamina: energy * 10
    });
    
    // Reward XP
    addXP(20, 'RESTORATION');
    addXP(20, 'SPEECH');
    addXP(20, 'ALTERATION');
    if (energy >= 8) {
      addXP(30, 'TWO-HANDED'); // High intensity bonus
    } else if (energy >= 5) {
      addXP(20, 'ONE-HANDED'); // Regular movement bonus
    }
  };

  return (
    <GameContext.Provider value={{ stats, notification, addXP, updateAttributes, notify, spendSkillPoint }}>
      {children}
    </GameContext.Provider>
  );
};
