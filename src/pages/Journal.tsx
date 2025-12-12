// src/pages/Journal.tsx
import React, { useEffect, useState, forwardRef } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FirebaseError } from 'firebase/app';
import { Link } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import Penguin3D from '../components/Penguin3D';
import '../styles/Journal.css';
import '../styles/Cobwebs.css';

interface MoodEntry {
  id: string;
  mood: number;
  energy: number;
  sleep: number;
  notes: string;
  timestamp: Timestamp;
}

// Page Component for FlipBook
const Page = forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div className="page" ref={ref}>
      <div className="page-content">
        {props.children}
      </div>
    </div>
  );
});

// Cover Page Component
const Cover = forwardRef<HTMLDivElement, any>((props, ref) => {
  const { mood = 5, energy = 5, sleep = 7 } = props.latestStats || {};

  return (
    <div className="page cover-page" ref={ref}>
      {props.showCobwebs && (
        <div className="cobwebs-overlay">
          <div className="cobweb cobweb-tl"></div>
          <div className="cobweb cobweb-tr"></div>
          <div className="cobweb cobweb-bl"></div>
          <div className="cobweb cobweb-br"></div>
          <div className="dust-overlay"></div>
        </div>
      )}
      <div className="cover-content">
        <h1 className="cover-title">My Journal</h1>
        <p className="cover-subtitle">Private & Personal</p>
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8, marginBottom: '2rem' }}>
          {props.owner}
        </p>
        <div className="cover-penguin-wrapper">
          <Penguin3D mood={mood} energy={energy} sleep={sleep} />
        </div>
      </div>
    </div>
  );
});

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

  // Check if there is an entry for today
  const hasEntryToday = entries.length > 0 && (() => {
    const lastEntryDate = entries[0].timestamp.toDate();
    const today = new Date();
    return (
      lastEntryDate.getDate() === today.getDate() &&
      lastEntryDate.getMonth() === today.getMonth() &&
      lastEntryDate.getFullYear() === today.getFullYear()
    );
  })();

  const showCobwebs = !hasEntryToday;

  if (loading) {
    return (
      <div className="journal-container">
        <p className="text-muted">Loading your diary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="journal-container">
        <p style={{ color: 'var(--danger-color)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="journal-container">
      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/dashboard" className="btn btn-secondary">
          &larr; Back to Dashboard
        </Link>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Click or drag page corners to turn
        </span>
      </div>

      <div className="book-wrapper">
        {/* @ts-ignore: HTMLFlipBook types can be tricky */}
        <HTMLFlipBook
          width={400}
          height={600}
          size="fixed"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          className="flip-book"
        >
          <Cover 
            owner={currentUser?.email} 
            showCobwebs={showCobwebs} 
            latestStats={entries.length > 0 ? entries[0] : undefined}
          />
          
          {entries.length === 0 ? (
            <Page number={1}>
              <div className="page-header">
                <span className="page-date">Today</span>
              </div>
              <p className="page-text">
                Dear Diary,<br/><br/>
                I haven't written anything yet. I should go to the dashboard and make a check-in!
              </p>
            </Page>
          ) : (
            entries.map((entry, index) => (
              <Page number={index + 1} key={entry.id}>
                <div className="page-header">
                  <span className="page-date">{entry.timestamp.toDate().toLocaleDateString()}</span>
                  <div className="page-stats">
                     M:{entry.mood} E:{entry.energy} S:{entry.sleep}h
                  </div>
                </div>
                <p className="page-text">
                  {entry.notes || "(No notes written for this entry)"}
                </p>
              </Page>
            ))
          )}
          
          <Page number={entries.length + 1}>
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
               <p style={{ color: '#aaa', fontStyle: 'italic' }}>The End</p>
             </div>
          </Page>
        </HTMLFlipBook>
      </div>
    </div>
  );
};

export default Journal;
