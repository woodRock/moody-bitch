// src/services/locationService.ts
import { db } from '../firebaseConfig';
import {
  collection, addDoc, Timestamp, query, where, getDocs, orderBy, writeBatch, limit,
} from 'firebase/firestore';
import { distanceMeters } from '../game/geo';

/** Two moments closer than this on the same day count as the same place. */
const SAME_PLACE_METERS = 150;

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
 * Record where the player was when something notable happened, at most once
 * per place per day so the map shows a journey rather than a blob around home.
 * Never throws: the map is decoration, it must not block gameplay.
 */
export const captureLocation = async (userId: string, label?: string): Promise<void> => {
  const position = await getCurrentPosition();
  if (!position) return;
  try {
    const here = { lat: position.coords.latitude, lng: position.coords.longitude };
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const today = await getDocs(query(
      collection(db, 'locationHistory'),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(dayStart)),
      orderBy('timestamp', 'asc'),
      limit(50),
    ));
    if (today.docs.some(d => { const x = d.data() as UserLocation; return distanceMeters(here, { lat: x.lat, lng: x.lng }) < SAME_PLACE_METERS; })) return;
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
