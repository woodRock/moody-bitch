// src/services/locationService.ts
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface UserLocation {
  id?: string;
  userId: string;
  lat: number;
  lng: number;
  timestamp: Timestamp;
  label?: string; // e.g., "Quest Completed", "Daily Log"
}

export const captureLocation = async (userId: string, label?: string): Promise<void> => {
  if (!navigator.geolocation) {
    console.warn("Geolocation is not supported by this browser.");
    return;
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await addDoc(collection(db, 'locationHistory'), {
          userId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Timestamp.now(),
          label
        });
        resolve();
      } catch (error) {
        console.error("Error saving location:", error);
        reject(error);
      }
    }, (error) => {
      console.error("Error getting location:", error);
      resolve(); // Resolve anyway to not block the UI
    });
  });
};

export const fetchLocationHistory = async (userId: string): Promise<UserLocation[]> => {
  const q = query(
    collection(db, 'locationHistory'),
    where('userId', '==', userId),
    orderBy('timestamp', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserLocation[];
};
