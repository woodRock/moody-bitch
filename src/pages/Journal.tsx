// src/pages/Journal.tsx
import React, { useEffect, useState, forwardRef, useRef } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FirebaseError } from 'firebase/app';
import { Link } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
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
        <img src="/avatar.jpg" alt="Avatar" className="cover-avatar" />
      </div>
    </div>
  );
});

const Journal: React.FC = () => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bookRef = useRef<any>(null); // Ref for HTMLFlipBook

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
          orderBy('timestamp', 'asc') // Changed to ascending
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

  // Check if there is an entry for today (now using the last entry after asc sort)
  const hasEntryToday = entries.length > 0 && (() => {
    const lastEntry = entries[entries.length - 1]; // Get the last entry
    if (!lastEntry) return false;
    const lastEntryDate = lastEntry.timestamp.toDate();
    const today = new Date();
    return (
      lastEntryDate.getDate() === today.getDate() &&
      lastEntryDate.getMonth() === today.getMonth() &&
      lastEntryDate.getFullYear() === today.getFullYear()
    );
  })();

  const showCobwebs = !hasEntryToday;

  const goToLatestEntry = () => {
    if (bookRef.current) {
      // +1 for the cover page, entries.length for the number of entries
      // If there are no entries, we go to the placeholder page (page 1)
      // Otherwise, the last entry is at index `entries.length - 1`, which corresponds to page `entries.length` (after cover page)
      // The "The End" page is `entries.length + 1`
      const lastEntryPageIndex = entries.length > 0 ? entries.length : 1; 
      bookRef.current.pageFlip().turnToPage(lastEntryPageIndex);
    }
  };

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
        {entries.length > 0 && (
          <button onClick={goToLatestEntry} className="btn btn-primary">
            Go to Latest Entry &rarr;
          </button>
        )}
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
          ref={bookRef}
        >
          <Cover 
            owner={currentUser?.email} 
            showCobwebs={showCobwebs} 
            latestStats={entries.length > 0 ? entries[entries.length - 1] : undefined}
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

