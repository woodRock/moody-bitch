import React, { useState } from 'react';
import { useQuests } from '../hooks/useQuests';
import { useSound } from '../context/SoundContext';
import Modal from '../components/Skyrim/Modal';
import QuestForm from '../components/Skyrim/QuestForm';
import type { Quest } from '../game/types';
import { skillMeaning } from '../game/skills';
import QuestRow from '../components/Skyrim/QuestRow';

const MobileQuests: React.FC = () => {
  const { quests, loading, adding, addQuest, toggleQuest, deleteQuest } = useQuests();
  const { playSound } = useSound();
  const [open, setOpen] = useState<Quest | null>(null);
  const [adderOpen, setAdderOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const current = open ? quests.find(q => q.id === open.id) ?? null : null;
  const dailies = quests.filter(q => q.type === 'daily');
  const bounties = quests.filter(q => q.type === 'weekly');
  const sides = quests.filter(q => q.type === 'one-off');
  const doneToday = dailies.filter(q => q.completed).length;

  const Row: React.FC<{ q: Quest }> = ({ q }) => (
    <QuestRow quest={q} onToggle={toggleQuest} onOpen={quest => { setOpen(quest); setConfirm(false); playSound('UI_CLICK'); }} />
  );

  return (
    <div className="m-page">
      <div className="m-page-head">
        <h1 className="skyrim-font">QUESTS</h1>
        <span className="skyrim-serif muted">{dailies.length > 0 ? `${doneToday}/${dailies.length} dailies done` : 'Every task is a quest'}</span>
      </div>

      {loading && <p className="skyrim-serif muted">Consulting the scrolls...</p>}
      {!loading && quests.length === 0 && (
        <div className="m-empty skyrim-serif">No quests yet. Tap + to accept your first. Every 5th completed quest drops loot.</div>
      )}

      {dailies.length > 0 && <div className="quest-category-title">Daily</div>}
      {dailies.map(q => <Row key={q.id} q={q} />)}
      {bounties.length > 0 && <div className="quest-category-title" style={{ marginTop: '1rem' }}>Bounties</div>}
      {bounties.map(q => <Row key={q.id} q={q} />)}
      {sides.length > 0 && <div className="quest-category-title" style={{ marginTop: '1rem' }}>Side Quests</div>}
      {sides.map(q => <Row key={q.id} q={q} />)}

      <button className="m-fab skyrim-font" onClick={() => { setAdderOpen(true); playSound('UI_CLICK'); }} aria-label="New quest">+</button>

      <Modal open={adderOpen} onClose={() => setAdderOpen(false)} title="NEW QUEST" className="sheet">
        <QuestForm adding={adding} onSubmit={addQuest} onDone={q => { if (q) setAdderOpen(false); }} onCancel={() => setAdderOpen(false)} />
      </Modal>

      <Modal open={!!current} onClose={() => setOpen(null)} title={current?.title.toUpperCase()} className="sheet">
        {current && (
          <>
            <p className="quest-description">{current.description}</p>
            <div className="quest-category-title">Objective</div>
            <p className="skyrim-serif">{current.type === 'daily' ? 'Resets each dawn. ' : current.type === 'weekly' ? 'A bounty: triple XP and loot, once a week. ' : ''}Invest in the {current.skill} skill <span className="meaning">({skillMeaning(current.skill)})</span> by completing this task.</p>
            <div className="form-actions">
              <button className="btn-primary skyrim-font" onClick={() => { void toggleQuest(current); setOpen(null); }}>{current.completed ? 'MARK INCOMPLETE' : 'COMPLETE QUEST'}</button>
              {confirm
                ? <button className="btn-ghost danger skyrim-font" onClick={() => { void deleteQuest(current.id); setOpen(null); }}>CONFIRM ABANDON</button>
                : <button className="btn-ghost skyrim-font" onClick={() => setConfirm(true)}>ABANDON</button>}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MobileQuests;
