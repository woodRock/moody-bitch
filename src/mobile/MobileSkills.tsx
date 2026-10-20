import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import { CONSTELLATIONS } from '../data/constellations';
import type { Constellation } from '../data/constellations';
import { canUnlock } from '../game/perks';
import { RACES } from '../game/spells';
import { LIMITS } from '../game/rules';
import Modal from '../components/Skyrim/Modal';
import LevelUpOverlay from '../components/Skyrim/LevelUpOverlay';

const MobileSkills: React.FC = () => {
  const { stats, spendSkillPoint, notify, updateDisplayName, updateRace, ui } = useGame();
  const { playSound } = useSound();
  const [open, setOpen] = useState<Constellation | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stats.name);
  const [race, setRace] = useState(stats.race);

  const unlock = async (con: Constellation, perkId: string) => {
    if (stats.perks.includes(perkId)) return;
    if (stats.skillPoints <= 0) { notify('NO PERK POINTS', 'Level up to earn more.'); return; }
    if (!canUnlock(con, perkId, stats.perks)) { notify('CANNOT UNLOCK', 'Prerequisite perk required.'); return; }
    await spendSkillPoint(perkId);
  };

  const saveIdentity = async () => {
    if (name.trim() && name.trim().toUpperCase() !== stats.name) await updateDisplayName(name);
    if (race !== stats.race) await updateRace(race);
    setEditing(false);
  };

  return (
    <div className="m-page">
      <LevelUpOverlay open={stats.pendingLevelUps > 0 && ui.modalDepth === 0} />

      <div className="m-page-head">
        <h1 className="skyrim-font">{stats.name}</h1>
        <button className="btn-ghost small skyrim-font" onClick={() => { setName(stats.name); setRace(stats.race); setEditing(true); }}>EDIT</button>
      </div>
      <div className="skyrim-serif muted" style={{ marginTop: '-0.5rem' }}>{stats.race} · Level {stats.level} · {stats.xp}/{stats.xpToNextLevel} XP</div>

      <div className="m-card perks-card">
        <span className="skyrim-font">PERKS TO SPEND</span>
        <span className="skyrim-font gold big">{stats.skillPoints}</span>
      </div>

      {CONSTELLATIONS.map(con => {
        const skill = stats.skills[con.skillKey] ?? { level: 0, xp: 0, xpToNextLevel: 100 };
        const owned = con.perks.filter(p => stats.perks.includes(p.id)).length;
        return (
          <button key={con.skillKey} className="m-skill" onClick={() => { setOpen(con); playSound('UI_CLICK'); }}>
            <svg viewBox="0 0 500 500" className="m-skill-art" aria-hidden="true">
              {con.spectralPaths.map((d, i) => <path key={i} d={d} />)}
              {con.perks.map(p => <circle key={p.id} cx={p.x} cy={p.y} r={stats.perks.includes(p.id) ? 14 : 8} className={stats.perks.includes(p.id) ? 'on' : ''} />)}
            </svg>
            <div className="m-skill-text">
              <div className="skyrim-font m-skill-name">{con.name} <span className="gold">{skill.level}</span></div>
              <div className="skill-progress-bar-container"><div className="skill-progress-bar-fill" style={{ width: `${(skill.xp / skill.xpToNextLevel) * 100}%` }} /></div>
              <div className="skyrim-serif muted small">{owned}/{con.perks.length} perks · {con.description}</div>
            </div>
          </button>
        );
      })}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name} className="sheet">
        {open && (
          <>
            <p className="skyrim-serif muted">{open.description}</p>
            <div className="skyrim-font" style={{ marginBottom: '1rem' }}>AVAILABLE POINTS: <span className="gold">{stats.skillPoints}</span></div>
            {open.perks.map(p => {
              const owned = stats.perks.includes(p.id);
              const available = !owned && canUnlock(open, p.id, stats.perks);
              return (
                <div key={p.id} className={`m-perk ${owned ? 'owned' : available ? 'available' : 'locked'}`}>
                  <div>
                    <div className="skyrim-font">{owned ? '★ ' : available ? '☆ ' : '· '}{p.name}</div>
                    <div className="skyrim-serif muted small">{p.description}</div>
                  </div>
                  {!owned && <button className="btn-ghost small skyrim-font" disabled={!available || stats.skillPoints <= 0} onClick={() => void unlock(open, p.id)}>UNLOCK</button>}
                </div>
              );
            })}
          </>
        )}
      </Modal>

      <Modal open={editing} onClose={() => setEditing(false)} title="IDENTITY" className="sheet">
        <div className="input-group">
          <label className="skyrim-font field-label" htmlFor="m-name"><span>NAME</span></label>
          <input id="m-name" className="parchment-input dark" value={name} maxLength={LIMITS.NAME} onChange={e => setName(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="skyrim-font field-label" htmlFor="m-race"><span>RACE</span></label>
          <select id="m-race" className="parchment-input dark" value={race} onChange={e => setRace(e.target.value)}>
            {RACES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-actions">
          <button className="btn-primary skyrim-font" onClick={() => void saveIdentity()}>SAVE</button>
          <button className="btn-ghost skyrim-font" onClick={() => setEditing(false)}>CANCEL</button>
        </div>
      </Modal>
    </div>
  );
};

export default MobileSkills;
