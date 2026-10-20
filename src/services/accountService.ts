import { collection, deleteDoc, doc, getDocs, limit, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const OWNED = ['quests', 'moodEntries', 'locationHistory'] as const;

/** Delete every document the player owns. Returns the number removed. */
export async function purgeUserData(uid: string): Promise<number> {
  let removed = 0;
  for (const col of OWNED) {
    for (;;) {
      const snap = await getDocs(query(collection(db, col), where('userId', '==', uid), limit(400)));
      if (snap.empty) break;
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      removed += snap.size;
      if (snap.size < 400) break;
    }
  }
  await deleteDoc(doc(db, 'userStats', uid));
  return removed + 1;
}
