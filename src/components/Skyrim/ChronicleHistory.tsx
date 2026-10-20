import React, { lazy, Suspense, useState } from 'react';
import { useSound } from '../../context/SoundContext';
import { energyEmoji, moodEmoji } from './LogForm';
import Modal from './Modal';
import type { MoodEntry } from '../../game/types';

const StatsChart = lazy(() => import('./StatsChart'));

interface Props {
  entries: MoodEntry[];
  hasMore: boolean;
  loadMore: () => void;
  deleteEntry: (id: string) => Promise<void>;
}

/** Past logs with the Lineage of Spirit chart. Collapsed until asked for. */
const ChronicleHistory: React.FC<Props> = ({ entries, hasMore, loadMore, deleteEntry }) => {
  const { playSound } = useSound();
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<MoodEntry | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (entries.length === 0) return null;

  return (
    <section className="today-card">
      <div className="column-head">
        <div className="quest-category-title" style={{ margin: 0 }}>Past Chronicles <span className="meaning">· {entries.length}{hasMore ? '+' : ''}</span></div>
        <button className="btn-ghost small skyrim-font" onClick={() => { setExpanded(e => !e); playSound('UI_CLICK'); }}>{expanded ? 'HIDE' : 'SHOW'}</button>
      </div>
      {expanded && (
        <>
          {entries.length > 1 && (
            <div style={{ margin: '0.5rem 0 1rem' }}>
              <Suspense fallback={null}><StatsChart entries={entries} maxPoints={14} /></Suspense>
            </div>
          )}
          {entries.map(e => (
            <button key={e.id} className="m-entry" onClick={() => { setOpen(e); setConfirm(false); playSound('UI_CLICK'); }}>
              <span className="skyrim-font">{e.timestamp.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span className="m-entry-scores skyrim-serif">{moodEmoji(e.mood)} {e.mood} · {energyEmoji(e.energy)} {e.energy} · 🌙 {e.sleep}h</span>
            </button>
          ))}
          {hasMore && <button className="btn-ghost small skyrim-font" style={{ alignSelf: 'center', marginTop: '0.8rem' }} onClick={loadMore}>LOAD OLDER</button>}
        </>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.timestamp.toDate().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()} className="sheet">
        {open && (
          <>
            <div className="entry-vitals skyrim-font">
              <div style={{ color: '#e05a4e' }}>HEALTH {open.mood}/10 <span className="meaning">mood</span></div>
              <div style={{ color: '#3d8de0' }}>MAGICKA {open.sleep}h <span className="meaning">rest</span></div>
              <div style={{ color: '#3fae3c' }}>STAMINA {open.energy}/10 <span className="meaning">energy</span></div>
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
    </section>
  );
};

export default ChronicleHistory;
