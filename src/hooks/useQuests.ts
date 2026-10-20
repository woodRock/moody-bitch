import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { generateQuestLore, fallbackLore } from '../services/loreService';
import { captureLocation } from '../services/locationService';
import { isQuestDone, LIMITS, sortQuests } from '../game/rules';
import type { Quest, QuestType } from '../game/types';

const MAX_QUESTS = 100;

/** Never trust document shape: fill defaults for anything missing. */
function toQuest(id: string, d: Partial<Quest>): Quest {
  return {
    id,
    title: typeof d.title === 'string' ? d.title : '(untitled)',
    description: typeof d.description === 'string' ? d.description : '',
    type: d.type === 'daily' || d.type === 'weekly' ? d.type : 'one-off',
    skill: typeof d.skill === 'string' ? d.skill : 'RESTORATION',
    completed: d.completed === true,
    lastCompleted: d.lastCompleted,
    createdAt: d.createdAt,
  };
}

/** Live list of the player's quests plus the actions that change them. */
export function useQuests() {
  const { currentUser } = useAuth();
  const { completeQuest, notify, stats } = useGame();
  const [raw, setRaw] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!currentUser) { setRaw([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, 'quests'), where('userId', '==', currentUser.uid));
    return onSnapshot(q, snap => {
      setRaw(snap.docs.map(d => toQuest(d.id, d.data() as Partial<Quest>)));
      setLoading(false);
    }, err => { console.error('Quest subscription failed', err); setLoading(false); });
  }, [currentUser]);

  // Re-evaluate "done today" when the day rolls over while the app is open.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const quests = useMemo(() => {
    void tick;
    const now = new Date();
    return sortQuests(raw.map(q => ({ ...q, completed: isQuestDone(q, now) })), now);
  }, [raw, tick]);

  const addQuest = useCallback(async (title: string, type: QuestType, skill: string): Promise<Quest | null> => {
    const clean = title.trim().slice(0, LIMITS.QUEST_TITLE);
    if (!clean || !currentUser || adding) return null;
    if (raw.length >= MAX_QUESTS) { notify('QUEST LOG FULL', 'Abandon an old quest first.'); return null; }
    setAdding(true);
    try {
      const description = fallbackLore(type);
      const ref = await addDoc(collection(db, 'quests'), {
        userId: currentUser.uid, title: clean, description, type, skill, completed: false, createdAt: Timestamp.now(),
      });
      // The scribe writes in the background; the quest is usable right away.
      void generateQuestLore(clean, type).then(lore => {
        if (lore && lore !== description) return updateDoc(ref, { description: lore });
      }).catch(err => console.warn('Lore arrived late or not at all', err));
      return { id: ref.id, title: clean, description, type, skill, completed: false };
    } catch (error) {
      console.error('Error adding quest:', error);
      notify('THE REALM RESISTS', 'Quest could not be recorded.');
      return null;
    } finally {
      setAdding(false);
    }
  }, [currentUser, adding, raw.length, notify]);

  const toggleQuest = useCallback(async (quest: Quest) => {
    if (!currentUser) return;
    const done = !quest.completed;
    try {
      await updateDoc(doc(db, 'quests', quest.id), {
        completed: done,
        lastCompleted: done ? Timestamp.now() : (quest.lastCompleted ?? null),
      });
      if (done) {
        await completeQuest(quest.skill, quest.type);
        if (stats.trackLocation) void captureLocation(currentUser.uid, `Completed: ${quest.title}`);
      }
    } catch (error) {
      console.error('Error updating quest:', error);
      notify('THE REALM RESISTS', 'Quest could not be updated.');
    }
  }, [currentUser, completeQuest, notify, stats.trackLocation]);

  const deleteQuest = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'quests', id));
    } catch (error) {
      console.error('Error deleting quest:', error);
      notify('THE REALM RESISTS', 'Quest could not be abandoned.');
    }
  }, [notify]);

  return { quests, loading, adding, addQuest, toggleQuest, deleteQuest };
}
