import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import { CONSTELLATIONS } from '../data/constellations';
import type { Constellation, Perk } from '../data/constellations';
import { RACES } from '../game/spells';
import { LIMITS } from '../game/rules';
import LevelUpOverlay from '../components/Skyrim/LevelUpOverlay';
import { perkStatus } from '../game/perks';
import { skillMeaning } from '../game/skills';

const NebulaFilters = () => (
  <svg className="nebula-defs" aria-hidden="true">
    <defs>
      <filter id="nebula-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
        <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  </svg>
);

const Skills: React.FC = () => {
  const { stats, spendSkillPoint, notify, setUI, ui, updateDisplayName, updateRace } = useGame();
  const { playSound } = useSound();
  const [selectedSkill, setSelectedSkill] = useState<Constellation | null>(null);
  const [focusedPerk, setFocusedPerk] = useState<Perk | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPlayedIndex = useRef(0);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingRace, setIsEditingRace] = useState(false);
  const [tempName, setTempName] = useState(stats.name);

  const pageWidth = () => scrollRef.current?.clientWidth ?? window.innerWidth;

  useEffect(() => {
    if (!selectedSkill && scrollRef.current) {
      scrollRef.current.scrollTo({ left: currentIndex * pageWidth(), behavior: 'instant' });
    }
  }, [selectedSkill, currentIndex]);

  const handleScroll = () => {
    if (!scrollRef.current || selectedSkill) return;
    const index = Math.round(scrollRef.current.scrollLeft / pageWidth());
    if (index !== lastPlayedIndex.current && index >= 0 && index < CONSTELLATIONS.length) {
      setCurrentIndex(index);
      lastPlayedIndex.current = index;
      playSound('UI_SWISH');
    }
  };

  const scrollBy = (delta: number) => {
    const newIndex = (currentIndex + delta + CONSTELLATIONS.length) % CONSTELLATIONS.length;
    setCurrentIndex(newIndex);
    lastPlayedIndex.current = newIndex;
    playSound('UI_CLICK');
    scrollRef.current?.scrollTo({ left: newIndex * pageWidth(), behavior: 'smooth' });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ui.modalDepth > 0 || ui.isMenuOpen || ui.isPauseMenuOpen || selectedSkill) return;
      if (e.key === 'ArrowLeft') scrollBy(-1);
      if (e.key === 'ArrowRight') scrollBy(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const tryUnlock = (perk: Perk) => {
    if (!selectedSkill) return;
    const st = perkStatus(selectedSkill, perk, stats);
    if (st.owned) return;
    if (!st.linked) { notify('CANNOT UNLOCK', 'Prerequisite perk required.'); return; }
    if (st.have < st.need) { notify('NOT YET EARNED', `${st.need - st.have} MORE ${selectedSkill.skillKey} QUEST${st.need - st.have === 1 ? '' : 'S'}`); return; }
    if (stats.skillPoints <= 0) { notify('NO PERK POINTS', 'Level up to earn more.'); return; }
    void spendSkillPoint(perk.id);
  };

  const handleStarClick = (perk: Perk) => {
    playSound('UI_CLICK');
    if (focusedPerk?.id === perk.id) tryUnlock(perk);
    else setFocusedPerk(perk);
  };

  const saveName = () => {
    if (tempName.trim() && tempName.trim().toUpperCase() !== stats.name) void updateDisplayName(tempName);
    setIsEditingName(false);
  };

  const overlaysOpen = ui.isMenuOpen || ui.isPauseMenuOpen;

  return (
    <div className="skills-container skills-screen">
      <NebulaFilters />
      <div className="star-field" />

      {!overlaysOpen && (
        <div className="character-info-bar">
          <div className="info-item" onDoubleClick={() => { setIsEditingName(true); setTempName(stats.name); }} title="Double-click to rename">
            NAME
            {isEditingName ? (
              <input autoFocus className="parchment-input dark inline" maxLength={LIMITS.NAME} value={tempName} onChange={e => setTempName(e.target.value)} onBlur={saveName} onKeyDown={e => e.key === 'Enter' && saveName()} aria-label="Character name" />
            ) : <span className="info-value">{stats.name}</span>}
          </div>

          <div className="info-item level-item">
            <span>LEVEL {stats.level}</span>
            <div className="xp-bar-bg"><div className="xp-bar-fill" style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }} /></div>
          </div>

          <div className="info-item" onDoubleClick={() => setIsEditingRace(true)} title="Double-click to change race">
            RACE
            {isEditingRace ? (
              <select autoFocus className="parchment-input dark inline" value={stats.race} onChange={e => { void updateRace(e.target.value); setIsEditingRace(false); }} onBlur={() => setIsEditingRace(false)} aria-label="Race">
                {RACES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
              </select>
            ) : <span className="info-value">{stats.race}</span>}
          </div>
        </div>
      )}

      {!selectedSkill && !ui.isPauseMenuOpen && (
        <div className="perks-remaining">
          <div className="skyrim-font">PERKS TO SPEND: <span>{stats.skillPoints}</span></div>
          <div className="menu-separator" style={{ margin: '0.5rem auto', width: '200px', opacity: 0.5 }} />
        </div>
      )}

      {!selectedSkill && (
        <>
          <div className="horizontal-skills-wrapper" ref={scrollRef} onScroll={handleScroll}>
            {CONSTELLATIONS.map((con, idx) => {
              const skill = stats.skills[con.skillKey] ?? { level: 0, xp: 0, xpToNextLevel: 100 };
              return (
                <div key={con.skillKey} className="skill-constellation-view" onClick={() => { if (!ui.isPauseMenuOpen) { setCurrentIndex(idx); setSelectedSkill(con); playSound('UI_CLICK'); } }}>
                  <svg width="500" height="500" viewBox="0 0 500 500" className="constellation-svg" aria-label={`${con.name} constellation`}>
                    {con.spectralPaths.map((path, i) => <path key={i} d={path} className="constellation-art" />)}
                    {con.lines.map(([s, e], i) => <line key={i} x1={con.perks[s].x} y1={con.perks[s].y} x2={con.perks[e].x} y2={con.perks[e].y} className="constellation-line" />)}
                    {con.perks.map(p => <circle key={p.id} cx={p.x} cy={p.y} r={stats.perks.includes(p.id) ? 8 : 4} fill={stats.perks.includes(p.id) ? '#e6c278' : '#444'} />)}
                  </svg>
                  <div className="constellation-caption">
                    <div className="skyrim-font constellation-name">{con.name} <span>{skill.level}</span></div>
                    <div className="skyrim-serif meaning" style={{ fontSize: '0.95rem' }}>{skillMeaning(con.skillKey)}</div>
                    <div className="skill-progress-bar-container"><div className="skill-progress-bar-fill" style={{ width: `${(skill.xp / skill.xpToNextLevel) * 100}%` }} /></div>
                    <div className="skyrim-serif constellation-desc">{con.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {!ui.isPauseMenuOpen && (
            <>
              <button onClick={() => scrollBy(-1)} className="nav-arrow left" aria-label="Previous constellation">&larr;</button>
              <button onClick={() => scrollBy(1)} className="nav-arrow right" aria-label="Next constellation">&rarr;</button>
              <button onClick={() => { setUI({ isMenuOpen: true }); playSound('UI_CLICK'); }} className="nav-arrow bottom" aria-label="Open character menu">&darr;</button>
            </>
          )}
        </>
      )}

      <LevelUpOverlay open={stats.pendingLevelUps > 0 && !selectedSkill && !overlaysOpen} />

      <AnimatePresence>
        {selectedSkill && (
          <motion.div className="skill-detail-overlay" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4 }}>
            <button onClick={e => { e.stopPropagation(); setSelectedSkill(null); setFocusedPerk(null); playSound('UI_CLICK'); }} className="btn-ghost skyrim-font back-btn">&larr; BACK</button>
            <div className="constellation-container" style={{ transform: focusedPerk ? `translate(${250 - focusedPerk.x}px, ${300 - focusedPerk.y}px) scale(1.5)` : 'translate(0, 0) scale(1)' }}>
              <svg width="500" height="600" viewBox="0 0 500 600" className="constellation-svg">
                {selectedSkill.spectralPaths.map((path, i) => <path key={i} d={path} className="constellation-art" />)}
                {selectedSkill.lines.map(([s, e], i) => {
                  const p1 = selectedSkill.perks[s]; const p2 = selectedSkill.perks[e];
                  const unlocked = stats.perks.includes(p1.id) && stats.perks.includes(p2.id);
                  return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className={`constellation-line ${unlocked ? 'unlocked' : ''}`} />;
                })}
                {selectedSkill.perks.map(p => {
                  const unlocked = stats.perks.includes(p.id); const focused = focusedPerk?.id === p.id;
                  const available = perkStatus(selectedSkill, p, stats).available;
                  return (
                    <g key={p.id} className={`constellation-star ${unlocked ? 'unlocked' : ''} ${focused ? 'focused' : ''} ${available ? 'available' : ''}`} onClick={() => handleStarClick(p)} role="button" aria-label={p.name}>
                      <circle cx={p.x} cy={p.y} r={unlocked ? 12 : 8} />
                      {focused && <circle cx={p.x} cy={p.y} r={20} fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="4 4" />}
                    </g>
                  );
                })}
              </svg>
            </div>
            <button onClick={() => { setSelectedSkill(null); setFocusedPerk(null); playSound('UI_CLICK'); }} className="nav-arrow bottom" aria-label="Back to constellations">&darr;</button>
            {focusedPerk && (
              <>
                <div className="perk-title-block">
                  <h2 className="skyrim-font">{focusedPerk.name.toUpperCase()}</h2>
                  <div className="menu-separator" style={{ margin: '0.5rem auto', width: '150px' }} />
                </div>
                <div className="perk-info-block">
                  <p className="skyrim-serif">{focusedPerk.description}</p>
                  {(() => {
                    const st = perkStatus(selectedSkill, focusedPerk, stats);
                    if (st.owned) return <div className="skyrim-font unlocked-label">[ PERK UNLOCKED ]</div>;
                    const label = !st.linked ? 'PREREQUISITE PERK REQUIRED' : st.have < st.need ? `EARN IT: ${st.have}/${st.need} ${selectedSkill.skillKey} QUESTS` : stats.skillPoints > 0 ? 'UNLOCK PERK (1 POINT)' : 'NEED SKILL POINTS';
                    return <button className="btn-unlock skyrim-font" disabled={!st.available || stats.skillPoints <= 0} onClick={() => tryUnlock(focusedPerk)}>{label}</button>;
                  })()}
                </div>
              </>
            )}
            <div className="available-points skyrim-font">AVAILABLE POINTS: <span>{stats.skillPoints}</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Skills;
