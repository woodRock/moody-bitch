import React, { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMoodEntries } from '../hooks/useMoodEntries';
import { useSound } from '../context/SoundContext';
import LogForm, { energyEmoji, moodEmoji } from '../components/Skyrim/LogForm';
import Modal from '../components/Skyrim/Modal';
import type { MoodEntry } from '../game/types';

const StatsChart = lazy(() => import('../components/Skyrim/StatsChart'));

const MobileLog: React.FC = () => {
  const { entries, loading, saving, streak, loggedToday, addEntry, deleteEntry } = useMoodEntries(60);
  const { playSound } = useSound();
  const [writing, setWriting] = useState(false);
  const [open, setOpen] = useState<MoodEntry | null>(null);
  const [confirm, setConfirm] = useState(false);

  const showForm = writing || (!loading && !loggedToday);

  return (
    <div className="m-page">
      <div className="m-page-head">
        <h1 className="skyrim-font">CHRONICLE</h1>
        <span className="skyrim-serif muted">{streak > 0 ? `🔥 ${streak} day streak` : 'Scribe each day for streak XP'}</span>
      </div>

      {showForm ? (
        <div className="m-card">
          <div className="quest-category-title">{loggedToday ? 'Another entry' : "Today's log"}</div>
          <LogForm saving={saving} streak={streak} onSubmit={async (...a) => { const ok = await addEntry(...a); if (ok) setWriting(false); return ok; }} onCancel={loggedToday ? () => setWriting(false) : undefined} />
        </div>
      ) : (
        <div className="m-card done-card">
          <div className="skyrim-font">TODAY IS SCRIBED</div>
          <p className="skyrim-serif muted">The scroll is inked. Return tomorrow to keep your streak.</p>
          <button className="btn-ghost small skyrim-font" onClick={() => setWriting(true)}>ADD ANOTHER</button>
        </div>
      )}

      {entries.length > 1 && (
        <div className="m-card">
          <div className="quest-category-title">Lineage of Spirit</div>
          <Suspense fallback={null}><StatsChart entries={entries} maxPoints={14} /></Suspense>
        </div>
      )}

      <div className="quest-category-title" style={{ marginTop: '1rem' }}>Past Chronicles</div>
      {entries.map(e => (
        <button key={e.id} className="m-entry" onClick={() => { setOpen(e); setConfirm(false); playSound('UI_CLICK'); }}>
          <span className="skyrim-font">{e.timestamp.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span className="m-entry-scores skyrim-serif">{moodEmoji(e.mood)} {e.mood} · {energyEmoji(e.energy)} {e.energy} · 🌙 {e.sleep}h</span>
        </button>
      ))}
      {entries.length > 0 && <Link to="/tome" className="btn-ghost small skyrim-font" style={{ marginTop: '1rem', alignSelf: 'center' }}>OPEN THE TOME</Link>}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.timestamp.toDate().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()} className="sheet">
        {open && (
          <>
            <div className="entry-vitals skyrim-font">
              <div style={{ color: '#e05a4e' }}>HEALTH {open.mood}/10</div>
              <div style={{ color: '#3d8de0' }}>MAGICKA {open.sleep}h</div>
              <div style={{ color: '#3fae3c' }}>STAMINA {open.energy}/10</div>
            </div>
            <div className="quest-category-title">Daily Triumphs</div>
            <ul className="skyrim-serif triumph-list">
              {open.highlights?.filter(Boolean).map((h, i) => <li key={i}>{h}</li>)}
              {(!open.highlights || open.highlights.every(h => !h)) && <li>No triumphs recorded for this day.</li>}
            </ul>
            <div className="form-actions">
              {confirm
                ? <button className="btn-ghost danger skyrim-font" onClick={() => { void deleteEntry(open.id); setOpen(null); }}>CONFIRM BURN</button>
                : <button className="btn-ghost skyrim-font" onClick={() => setConfirm(true)}>BURN THIS PAGE</button>}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MobileLog;
