import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import HUD from '../components/Skyrim/HUD';
import SkyrimMenu from '../components/Skyrim/Menu';
import PauseMenu from '../components/Skyrim/PauseMenu';
import { CONSTELLATIONS } from '../data/constellations';
import type { Constellation, Perk } from '../data/constellations';
import '../styles/Skyrim.css';

const NebulaFilters = () => (
  <svg className="nebula-defs">
    <defs>
      <filter id="nebula-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

const Skills: React.FC = () => {
  const { stats, spendSkillPoint } = useGame();
  const { currentUser } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState<Constellation | null>(null);
  const [focusedPerk, setFocusedPerk] = useState<Perk | null>(null);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);

  const handleStarClick = (perk: Perk) => {
    if (focusedPerk?.id === perk.id) {
      if (!stats.perks.includes(perk.id) && stats.skillPoints > 0) {
        // Check prerequisites (is there a line where this is the 'end' point?)
        const constellation = selectedSkill!;
        const perkIndex = constellation.perks.findIndex(p => p.id === perk.id);
        
        // The first perk in the list (index 0) is the root and always unlockable
        const hasPrereq = perkIndex === 0 || constellation.lines.some(([start, end]) => {
          return end === perkIndex && stats.perks.includes(constellation.perks[start].id);
        });

        if (hasPrereq) {
          spendSkillPoint(perk.id);
        } else {
          notify("CANNOT UNLOCK", "Prerequisite perk required.");
        }
      }
    } else {
      setFocusedPerk(perk);
    }
  };

  return (
    <div className="skills-container" style={{ background: 'radial-gradient(circle at center, #0a0e14 0%, #000 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <NebulaFilters />
      <div className="star-field"></div>
      
      <div className="character-info-bar">
        <div className="info-item">NAME <span className="info-value">{currentUser?.email?.split('@')[0].toUpperCase()}</span></div>
        <div className="info-item">LEVEL <span className="info-value">{stats.level}</span></div>
        <div className="info-item">RACE <span className="info-value">{stats.race}</span></div>
      </div>

      <SkyrimMenu onOpenPause={() => setIsPauseMenuOpen(true)} />
      <PauseMenu isOpen={isPauseMenuOpen} onClose={() => setIsPauseMenuOpen(false)} />

      {!selectedSkill && (
        <div className="horizontal-skills-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
          {CONSTELLATIONS.map((con, idx) => {
            const skill = stats.skills[con.skillKey] || { level: 0, xp: 0, xpToNextLevel: 100 };
            return (
              <div key={idx} className="skill-constellation-view" onClick={() => setSelectedSkill(con)} style={{ cursor: 'pointer' }}>
                <svg width="500" height="500" viewBox="0 0 500 500" className="constellation-svg">
                  {con.spectralPaths.map((path, i) => (
                    <path key={i} d={path} className="constellation-art" />
                  ))}
                  
                  {con.lines.map(([s, e], i) => (
                    <line key={i} x1={con.perks[s].x} y1={con.perks[s].y} x2={con.perks[e].x} y2={con.perks[e].y} className="constellation-line" />
                  ))}
                  {con.perks.map(p => (
                    <circle key={p.id} cx={p.x} cy={p.y} r={stats.perks.includes(p.id) ? 8 : 4} fill={stats.perks.includes(p.id) ? '#e6c278' : '#444'} />
                  ))}
                </svg>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <div className="skyrim-font" style={{ fontSize: '2rem', color: '#fff' }}>
                    {con.name} <span style={{ color: 'var(--skyrim-gold-dim)', marginLeft: '10px' }}>{skill.level}</span>
                  </div>
                  <div className="skill-progress-bar-container" style={{ margin: '10px auto' }}>
                    <div className="skill-progress-bar-fill" style={{ width: `${(skill.xp / skill.xpToNextLevel) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSkill && (
        <div className="skill-detail-overlay" style={{ zIndex: 600 }}>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setSelectedSkill(null); 
              setFocusedPerk(null); 
            }} 
            className="btn skyrim-font" 
            style={{ 
              position: 'fixed', 
              top: '5rem', 
              left: '2rem', 
              zIndex: 1000, 
              background: 'rgba(0,0,0,0.6)', 
              border: '1px solid var(--skyrim-gold-dim)' 
            }}
          >
            &larr; BACK
          </button>

          <div 
            className="constellation-container"
            style={{ 
              transform: focusedPerk 
                ? `translate(${250 - focusedPerk.x}px, ${300 - focusedPerk.y}px) scale(1.5)` 
                : 'translate(0, 0) scale(1)' 
            }}
          >
            <svg width="500" height="600" viewBox="0 0 500 600" className="constellation-svg">
              {selectedSkill.spectralPaths.map((path, i) => (
                <path key={i} d={path} className="constellation-art" />
              ))}

              {selectedSkill.lines.map(([s, e], i) => {
                const p1 = selectedSkill.perks[s];
                const p2 = selectedSkill.perks[e];
                const unlocked = stats.perks.includes(p1.id) && stats.perks.includes(p2.id);
                return (
                  <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className={`constellation-line ${unlocked ? 'unlocked' : ''}`} />
                );
              })}
              {selectedSkill.perks.map(p => {
                const unlocked = stats.perks.includes(p.id);
                const focused = focusedPerk?.id === p.id;
                return (
                  <g key={p.id} className={`constellation-star ${unlocked ? 'unlocked' : ''} ${focused ? 'focused' : ''}`} onClick={() => handleStarClick(p)}>
                    <circle cx={p.x} cy={p.y} r={unlocked ? 12 : 8} />
                    {focused && <circle cx={p.x} cy={p.y} r={20} fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="4 4" />}
                  </g>
                );
              })}
            </svg>
          </div>

          {focusedPerk && (
            <div className="perk-focus-info">
              <h2 className="skyrim-font" style={{ color: '#e6c278', margin: 0 }}>{focusedPerk.name}</h2>
              <p className="skyrim-serif" style={{ color: '#fff', fontSize: '1.1rem', margin: '10px 0' }}>{focusedPerk.description}</p>
              {!stats.perks.includes(focusedPerk.id) ? (
                <button 
                  className="btn-unlock" 
                  disabled={stats.skillPoints <= 0}
                  onClick={() => spendSkillPoint(focusedPerk.id)}
                >
                  {stats.skillPoints > 0 ? `UNLOCK PERK (1 POINT)` : 'NEED SKILL POINTS'}
                </button>
              ) : (
                <div className="skyrim-font" style={{ color: 'var(--skyrim-gold-bright)' }}>PERK UNLOCKED</div>
              )}
            </div>
          )}

          <div style={{ position: 'fixed', bottom: '2rem', right: '4rem' }} className="skyrim-font">
             AVAILABLE POINTS: <span style={{ color: '#fff' }}>{stats.skillPoints}</span>
          </div>
        </div>
      )}

      <HUD showCompass={false} showLevel={false} />
    </div>
  );
};

export default Skills;
