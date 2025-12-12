// src/pages/Journal.tsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FirebaseError } from 'firebase/app';
import '../styles/Journal.css';

interface MoodEntry {
  id: string;
  mood: number;
  energy: number;
  sleep: number;
  notes: string;
  timestamp: Timestamp;
}

const Journal: React.FC = () => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!currentUser) {
        setLoading(false);
        setError('You must be logged in to view journal entries.');
        return;
      }

      try {
        const q = query(
          collection(db, 'moodEntries'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedEntries: MoodEntry[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MoodEntry[];
        setEntries(fetchedEntries);
      } catch (err) {
        if (err instanceof FirebaseError) {
          setError('Error fetching journal entries: ' + err.message);
        } else {
          setError('An unexpected error occurred while fetching journal entries.');
        }
        console.error('Error fetching documents: ', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="journal-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-muted">Loading journal entries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="journal-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--danger-color)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="journal-container">
      <h1 className="journal-header">Your Journal Entries</h1>
      <div className="journal-list">
        {entries.length === 0 ? (
          <p className="text-center text-muted">No journal entries yet. Make a daily check-in!</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="journal-entry-card">
              <div className="entry-header">
                <h2 className="entry-date">
                  {entry.timestamp.toDate().toLocaleDateString()}
                </h2>
                <span className="entry-stats">
                  Mood: {entry.mood}/10 | Energy: {entry.energy}/10 | Sleep: {entry.sleep}h
                </span>
              </div>
              <p className="entry-notes">{entry.notes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Journal;
