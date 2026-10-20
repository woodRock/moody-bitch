import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { captureLocation } from '../services/locationService';
import { computeStreak, hasLoggedToday, LIMITS } from '../game/rules';
import type { MoodEntry } from '../game/types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Live journal entries (newest first) with streak maths and write actions. */
export function useMoodEntries(initialMax = 120) {
  const [max, setMax] = useState(initialMax);
  const { currentUser } = useAuth();
  const { submitLog, notify, stats } = useGame();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) { setEntries([]); setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, 'moodEntries'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(max),
    );
    return onSnapshot(q, snap => {
      setEntries(snap.docs
        .map(d => ({ id: d.id, ...(d.data() as Omit<MoodEntry, 'id'>) }))
        .filter(e => e.timestamp instanceof Timestamp));
      setLoading(false);
    }, err => { console.error('Journal subscription failed', err); setLoading(false); });
  }, [currentUser, max]);

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const loggedToday = useMemo(() => hasLoggedToday(entries), [entries]);

  const addEntry = useCallback(async (mood: number, energy: number, sleep: number, highlights: string[]): Promise<boolean> => {
    if (!currentUser || saving) return false;
    const m = clamp(Math.round(mood), 1, 10);
    const e = clamp(Math.round(energy), 1, 10);
    const s = Number.isFinite(sleep) ? clamp(sleep, 0, 24) : 0;
    const h = highlights.map(x => x.trim().slice(0, LIMITS.HIGHLIGHT)).filter(Boolean).slice(0, 5);
    setSaving(true);
    try {
      await addDoc(collection(db, 'moodEntries'), {
        userId: currentUser.uid, mood: m, energy: e, sleep: s, highlights: h, timestamp: Timestamp.now(),
      });
      // The streak including today's entry, before the snapshot catches up.
      const streakAfter = computeStreak([...entries, { timestamp: Timestamp.now() }]);
      await submitLog(m, e, s, streakAfter);
      if (stats.trackLocation) void captureLocation(currentUser.uid, 'Scribed a Daily Log');
      return true;
    } catch (err) {
      console.error('Error adding log:', err);
      notify('THE REALM RESISTS', 'Your chronicle was not saved.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [currentUser, saving, entries, submitLog, notify, stats.trackLocation]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'moodEntries', id));
    } catch (err) {
      console.error('Error deleting log:', err);
      notify('THE REALM RESISTS', 'Entry could not be burned.');
    }
  }, [notify]);

  const hasMore = entries.length >= max;
  const loadMore = useCallback(() => setMax(m => m + 60), []);

  return { entries, loading, saving, streak, loggedToday, addEntry, deleteEntry, hasMore, loadMore };
}
