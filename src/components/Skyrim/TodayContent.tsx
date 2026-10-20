import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { useQuests } from '../../hooks/useQuests';
import { useMoodEntries } from '../../hooks/useMoodEntries';
import { stoneById } from '../../game/stones';
import QuestRow from './QuestRow';
import Onboarding from './Onboarding';
import ChronicleHistory from './ChronicleHistory';
import { DECAY_PER_HOUR } from '../../game/rules';
import LogForm, { energyEmoji, moodEmoji } from './LogForm';
import Modal from './Modal';
import QuestForm from './QuestForm';

/**
 * The daily loop on one screen: scribe the log, tick the dailies, watch the
 * bars. Shared by the desktop Today page and the mobile Today tab.
 */
const TodayContent: React.FC = () => {
  const { stats, statsLoaded } = useGame();
  const { playSound } = useSound();
  const { quests, loading: questsLoading, adding, addQuest, toggleQuest } = useQuests();
  const { entries, loading: logLoading, saving, streak, loggedToday, addEntry, deleteEntry, hasMore, loadMore } = useMoodEntries(60);
  const [writing, setWriting] = useState(false);
  const [adderOpen, setAdderOpen] = useState(false);

  const now = new Date();
  const recurring = quests.filter(q => q.type !== 'one-off');
  const sides = quests.filter(q => q.type === 'one-off' && !q.completed);
  const doneCount = recurring.filter(q => q.completed).length;
  const todayEntry = entries[0];
  const stone = stoneById(stats.standingStone);
  const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  const hoursSince = stats.vitalsUpdatedAt ? (Date.now() - stats.vitalsUpdatedAt) / 3_600_000 : 0;
  const drained = Math.floor(hoursSince * DECAY_PER_HOUR);

  return (
    <div className="today">
      <header className="today-head">
        <div>
          <div className="skyrim-font today-weekday">{now.toLocaleDateString(undefined, { weekday: 'long' })}</div>
          <div className="skyrim-serif muted">{now.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="today-badges">
          {streak > 0 && <span className="streak-pill skyrim-font" style={{ margin: 0 }}>🔥 {streak} DAY STREAK</span>}
          {stats.pendingLevelUps > 0 && <Link to="/skills" className="streak-pill skyrim-font levelup" style={{ margin: 0 }}>LEVEL UP WAITING</Link>}
        </div>
      </header>

      <section className="today-card vitals-card">
        <div className="quest-category-title">Vitals</div>
        <div className="vital-row"><span className="skyrim-font" style={{ color: '#e05a4e' }}>HEALTH</span><div className="stat-bar-bg"><div className="stat-bar-fill bar-health" style={{ width: pct(stats.health, stats.healthMax) }} /></div><b>{stats.health}/{stats.healthMax}</b></div>
        <div className="vital-row"><span className="skyrim-font" style={{ color: '#3d8de0' }}>MAGICKA</span><div className="stat-bar-bg"><div className="stat-bar-fill bar-magicka" style={{ width: pct(stats.magicka, stats.magickaMax) }} /></div><b>{stats.magicka}/{stats.magickaMax}</b></div>
        <div className="vital-row"><span className="skyrim-font" style={{ color: '#3fae3c' }}>STAMINA</span><div className="stat-bar-bg"><div className="stat-bar-fill bar-stamina" style={{ width: pct(stats.stamina, stats.staminaMax) }} /></div><b>{stats.stamina}/{stats.staminaMax}</b></div>
        <p className="skyrim-serif muted small">{drained > 0 ? <span className="draining-note">Draining · −{drained} since your last log{hoursSince >= 24 ? ' (over a day ago)' : ''}. </span> : 'Vitals drift down through the day. '}A log resets them; potions and Heal Self restore them.{stone ? ` ${stone.icon} ${stone.name} blesses your training this week.` : ''}</p>
      </section>

      <section className="today-card">
        <div className="column-head">
          <div className="quest-category-title" style={{ margin: 0 }}>Chronicle</div>
          {loggedToday && !writing && <button className="btn-ghost small skyrim-font" onClick={() => setWriting(true)}>ADD ANOTHER</button>}
        </div>
        {logLoading ? <p className="skyrim-serif muted">Consulting the scrolls...</p> : (!loggedToday || writing) ? (
          <LogForm saving={saving} streak={streak} onSubmit={async (...a) => { const ok = await addEntry(...a); if (ok) setWriting(false); return ok; }} onCancel={loggedToday ? () => setWriting(false) : undefined} />
        ) : (
          <div className="today-scribed">
            <div className="skyrim-font">TODAY IS SCRIBED</div>
            {todayEntry && <div className="skyrim-serif muted">{moodEmoji(todayEntry.mood)} Mood {todayEntry.mood} · {energyEmoji(todayEntry.energy)} Energy {todayEntry.energy} · 🌙 {todayEntry.sleep}h rest</div>}
            {todayEntry?.highlights?.filter(Boolean).length ? <ul className="skyrim-serif triumph-list small">{todayEntry.highlights.filter(Boolean).map((h, i) => <li key={i}>{h}</li>)}</ul> : null}
          </div>
        )}
      </section>

      <section className="today-card">
        <div className="column-head">
          <div className="quest-category-title" style={{ margin: 0 }}>Dailies & Bounties {recurring.length > 0 && <span className="muted">· {doneCount}/{recurring.length}</span>}</div>
          <button className="btn-ghost small skyrim-font" onClick={() => { setAdderOpen(true); playSound('UI_CLICK'); }}>+ QUEST</button>
        </div>
        {questsLoading && <p className="skyrim-serif muted">Consulting the scrolls...</p>}
        {!questsLoading && recurring.length === 0 && <p className="skyrim-serif muted">No dailies yet. A daily resets at dawn, a bounty every Monday. Add one and make tomorrow easier.</p>}
        {recurring.map(q => <QuestRow key={q.id} quest={q} onToggle={toggleQuest} />)}
        {sides.length > 0 && (
          <>
            <div className="quest-category-title" style={{ marginTop: '1rem' }}>Open side quests</div>
            {sides.slice(0, 5).map(q => <QuestRow key={q.id} quest={q} onToggle={toggleQuest} />)}
            {sides.length > 5 && <Link to="/quests" className="skyrim-serif muted small">and {sides.length - 5} more in the quest log</Link>}
          </>
        )}
      </section>

      <ChronicleHistory entries={entries} hasMore={hasMore} loadMore={loadMore} deleteEntry={deleteEntry} />

      <Modal open={adderOpen} onClose={() => setAdderOpen(false)} title="NEW QUEST" className="sheet">
        <QuestForm adding={adding} onSubmit={addQuest} onDone={q => { if (q) setAdderOpen(false); }} onCancel={() => setAdderOpen(false)} />
      </Modal>

      <Onboarding open={statsLoaded && !stats.onboarded && !questsLoading && quests.length === 0} />
    </div>
  );
};

export default TodayContent;
