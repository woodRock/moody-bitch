// The flip-book "Scrolls of Time": every chronicle as a page in a leather tome.
import React, { forwardRef, useRef } from 'react';
import { Link } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useMoodEntries } from '../hooks/useMoodEntries';
import '../styles/Journal.css';
import '../styles/Cobwebs.css';

const Page = forwardRef<HTMLDivElement, { children: React.ReactNode }>((props, ref) => (
  <div className="page" ref={ref}><div className="page-content">{props.children}</div></div>
));
Page.displayName = 'Page';

const Cover = forwardRef<HTMLDivElement, { owner: string; showCobwebs: boolean }>((props, ref) => (
  <div className="page cover-page" ref={ref}>
    {props.showCobwebs && (
      <div className="cobwebs-overlay" aria-hidden="true">
        <div className="cobweb cobweb-tl" /><div className="cobweb cobweb-tr" /><div className="cobweb cobweb-bl" /><div className="cobweb cobweb-br" />
        <div className="dust-overlay" />
      </div>
    )}
    <div className="cover-content">
      <h1 className="cover-title">SCROLLS OF TIME</h1>
      <p className="cover-subtitle">Chronicles of the Dragonborn</p>
      <p className="cover-owner">{props.owner}</p>
      <img src={`${import.meta.env.BASE_URL}avatar.jpg`} alt="" className="cover-avatar" />
    </div>
  </div>
));
Cover.displayName = 'Cover';

const Tome: React.FC = () => {
  const { currentUser } = useAuth();
  const { stats } = useGame();
  const { entries, loading, loggedToday } = useMoodEntries(200);
  const bookRef = useRef<{ pageFlip: () => { turnToPage: (n: number) => void } } | null>(null);
  const ordered = [...entries].reverse();

  const goToLatest = () => bookRef.current?.pageFlip().turnToPage(Math.max(1, ordered.length));

  const isSmall = typeof window !== 'undefined' && window.innerWidth < 900;
  const width = isSmall ? Math.min(360, window.innerWidth - 32) : 400;
  const height = isSmall ? Math.round(width * 1.45) : 600;

  return (
    <div className="journal-container">
      <div className="tome-toolbar">
        <Link to="/dashboard" className="btn-ghost skyrim-font">&larr; Return</Link>
        {ordered.length > 0 && <button onClick={goToLatest} className="btn-ghost skyrim-font">Latest Chronicle &rarr;</button>}
        <span className="skyrim-serif muted">Drag a page corner to turn it</span>
      </div>

      {loading ? <p className="skyrim-serif muted">Consulting the Elder Scrolls...</p> : (
        <div className="book-wrapper">
          {/* @ts-expect-error react-pageflip types lag behind its props */}
          <HTMLFlipBook
            width={width} height={height} size="fixed" minWidth={280} maxWidth={1000} minHeight={400} maxHeight={1533}
            maxShadowOpacity={0.5} showCover={true} mobileScrollSupport={true} usePortrait={isSmall}
            className="flip-book" ref={bookRef}
          >
            <Cover owner={stats.name || currentUser?.email || ''} showCobwebs={!loggedToday} />
            {ordered.length === 0 ? (
              <Page>
                <div className="page-header"><span className="page-date">TODAY</span></div>
                <div className="page-text">The scroll is blank.<br /><br />No triumphs have been recorded in this age. Scribe your first log to begin.</div>
              </Page>
            ) : ordered.map(entry => (
              <Page key={entry.id}>
                <div className="page-header">
                  <span className="page-date">{entry.timestamp.toDate().toLocaleDateString()}</span>
                  <div className="page-stats">H {entry.mood} · S {entry.energy} · M {entry.sleep}h</div>
                </div>
                <div className="page-text">
                  <h4>TODAY'S TRIUMPHS</h4>
                  <ul>
                    {entry.highlights?.filter(Boolean).map((h, i) => <li key={i}>{h}</li>)}
                    {(!entry.highlights || entry.highlights.every(h => !h)) && <li>(The scribe left no notes)</li>}
                  </ul>
                </div>
              </Page>
            ))}
            <Page>
              <div className="page-end"><p>The End of the Current Age</p></div>
            </Page>
          </HTMLFlipBook>
        </div>
      )}
    </div>
  );
};

export default Tome;
