import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { useQuests } from '../../hooks/useQuests';
import { RACES } from '../../game/spells';
import { STONES } from '../../game/stones';
import { LIMITS } from '../../game/rules';
import { skillMeaning } from '../../game/skills';
import Modal from './Modal';

const STARTERS: { title: string; skill: string }[] = [
  { title: 'Get outside for twenty minutes', skill: 'ONE-HANDED' },
  { title: 'In bed by the same hour', skill: 'RESTORATION' },
  { title: 'Drink two litres of water', skill: 'ALCHEMY' },
  { title: 'One block of deep work', skill: 'ENCHANTING' },
  { title: 'Ten minutes of stillness', skill: 'ALTERATION' },
  { title: 'Message someone you care about', skill: 'SPEECH' },
  { title: 'Shower, teeth, tidy the room', skill: 'SMITHING' },
  { title: 'A proper training session', skill: 'TWO-HANDED' },
];

/** The first day: name, race, a sign, and three dailies, so tomorrow already has a shape. */
const Onboarding: React.FC<{ open: boolean }> = ({ open }) => {
  const { stats, updateDisplayName, updateRace, setStandingStone, setOnboarded, notify } = useGame();
  const { addQuest } = useQuests();
  const { playSound } = useSound();
  const [name, setName] = useState(stats.name);
  const [race, setRace] = useState(stats.race);
  const [stone, setStone] = useState<string>('lover');
  const [picked, setPicked] = useState<Set<string>>(() => new Set(STARTERS.slice(0, 3).map(s => s.title)));
  const [busy, setBusy] = useState(false);

  const togglePick = (t: string) => setPicked(p => { const n = new Set(p); if (n.has(t)) n.delete(t); else n.add(t); return n; });

  const begin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (name.trim() && name.trim().toUpperCase() !== stats.name) await updateDisplayName(name);
      if (race !== stats.race) await updateRace(race);
      await setStandingStone(stone);
      for (const s of STARTERS.filter(s => picked.has(s.title))) await addQuest(s.title, 'daily', s.skill);
      await setOnboarded();
      playSound('QUEST_COMPLETE');
      notify('YOUR SAGA BEGINS', 'SCRIBE TONIGHT TO START A STREAK');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => {}} title="A NEW LIFE IN SKYRIM" width={640} className="sheet onboarding">
      <p className="skyrim-serif modal-lead">Three choices and you are ready. Everything here can be changed later from Skills and the System menu.</p>

      <div className="input-group">
        <label className="skyrim-font field-label" htmlFor="ob-name"><span>YOUR NAME</span></label>
        <input id="ob-name" className="parchment-input dark" value={name} maxLength={LIMITS.NAME} onChange={e => setName(e.target.value)} />
      </div>
      <div className="input-group">
        <label className="skyrim-font field-label" htmlFor="ob-race"><span>RACE</span><span className="field-value">cosmetic</span></label>
        <select id="ob-race" className="parchment-input dark" value={race} onChange={e => setRace(e.target.value)}>
          {RACES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="quest-category-title">Standing stone <span className="meaning">· which skills train faster this week</span></div>
      <div className="stones-grid" style={{ marginBottom: '1.2rem' }}>
        {STONES.map(s => (
          <button key={s.id} type="button" className={`stone ${stone === s.id ? 'active' : ''}`} onClick={() => setStone(s.id)} aria-pressed={stone === s.id}>
            <span className="stone-icon" aria-hidden="true">{s.icon}</span>
            <span className="stone-name skyrim-font">{s.name.replace('The ', '').replace(' Stone', '')}</span>
            <span className="stone-desc skyrim-serif">{s.description}</span>
          </button>
        ))}
      </div>

      <div className="quest-category-title">Starter dailies <span className="meaning">· pick a few, they reset at dawn</span></div>
      <div className="starter-list">
        {STARTERS.map(s => (
          <label key={s.title} className={`starter ${picked.has(s.title) ? 'on' : ''}`}>
            <input type="checkbox" checked={picked.has(s.title)} onChange={() => togglePick(s.title)} />
            <span className="skyrim-serif">{s.title}</span>
            <span className="skyrim-font starter-skill">{s.skill} <span className="meaning">· {skillMeaning(s.skill)}</span></span>
          </label>
        ))}
      </div>

      <div className="form-actions">
        <button className="btn-primary skyrim-font" onClick={() => void begin()} disabled={busy || !name.trim()}>{busy ? 'THE SCRIBE WRITES...' : 'BEGIN YOUR SAGA'}</button>
      </div>
    </Modal>
  );
};

export default Onboarding;
