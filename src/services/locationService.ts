// src/services/locationService.ts
import { db } from '../firebaseConfig';
import {
  collection, addDoc, Timestamp, query, where, getDocs, orderBy, writeBatch, limit,
} from 'firebase/firestore';

export interface UserLocation {
  id?: string;
  userId: string;
  lat: number;
  lng: number;
  timestamp: Timestamp;
  label?: string; // e.g., "Quest Completed", "Daily Log"
}

export const getCurrentPosition = (): Promise<GeolocationPosition | null> => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser.');
    return Promise.resolve(null);
  }
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      err => { console.warn('Error getting location:', err.message); resolve(null); },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  });
};

/**
 * Record where the player was when something notable happened. Never throws:
 * the map is decoration, it must not block gameplay.
 */
export const captureLocation = async (userId: string, label?: string): Promise<void> => {
  const position = await getCurrentPosition();
  if (!position) return;
  try {
    await addDoc(collection(db, 'locationHistory'), {
      userId,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Timestamp.now(),
      label: (label ?? '').slice(0, 120),
    });
  } catch (error) {
    console.error('Error saving location:', error);
  }
};

export const fetchLocationHistory = async (userId: string, max = 500): Promise<UserLocation[]> => {
  const q = query(
    collection(db, 'locationHistory'),
    where('userId', '==', userId),
    orderBy('timestamp', 'asc'),
    limit(max),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserLocation[];
};

/** Delete every location the player has recorded. Returns how many were removed. */
export const clearLocationHistory = async (userId: string): Promise<number> => {
  let removed = 0;
  for (;;) {
    const snap = await getDocs(query(collection(db, 'locationHistory'), where('userId', '==', userId), limit(400)));
    if (snap.empty) break;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    removed += snap.size;
    if (snap.size < 400) break;
  }
  return removed;
};
