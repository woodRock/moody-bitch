import React, { useState, useRef, useEffect } from 'react';
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
  const { stats, spendSkillPoint, notify } = useGame();
  const { currentUser } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState<Constellation | null>(null);
  const [focusedPerk, setFocusedPerk] = useState<Perk | null>(null);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  
  // Track the last index to restore scroll
  const [lastSelectedIndex, setLastSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore scroll position when returning to overview
  useEffect(() => {
    if (!selectedSkill && scrollRef.current) {
      const container = scrollRef.current;
      // We calculate approximate scroll based on index
      // itemWidth is 60vw (min-width) + 100px (gap)
      const vw = window.innerWidth / 100;
      const itemWidth = (60 * vw) + 100;
      
      container.scrollTo({
        left: lastSelectedIndex * itemWidth,
        behavior: 'instant'
      });
    }
  }, [selectedSkill, lastSelectedIndex]);

  const handleStarClick = (perk: Perk) => {
    if (focusedPerk?.id === perk.id) {
      if (!stats.perks.includes(perk.id) && stats.skillPoints > 0) {
        const constellation = selectedSkill!;
        const perkIndex = constellation.perks.findIndex(p => p.id === perk.id);
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
        <div className="horizontal-skills-wrapper" ref={scrollRef} style={{ display: 'flex', alignItems: 'center' }}>
          {CONSTELLATIONS.map((con, idx) => {
            const skill = stats.skills[con.skillKey] || { level: 0, xp: 0, xpToNextLevel: 100 };
            return (
              <div 
                key={idx} 
                className="skill-constellation-view" 
                onClick={() => {
                  setLastSelectedIndex(idx);
                  setSelectedSkill(con);
                }} 
                style={{ cursor: 'pointer' }}
              >
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
            <>
              <div style={{ 
                position: 'fixed', 
                top: '38vh', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                textAlign: 'center', 
                zIndex: 700,
                width: '100%',
                pointerEvents: 'none'
              }}>
                <h2 className="skyrim-font" style={{ 
                  color: '#e6c278', 
                  fontSize: '1.5rem', 
                  margin: 0, 
                  textShadow: '0 0 10px rgba(230, 194, 120, 0.6), 2px 2px 4px #000',
                  letterSpacing: '2px'
                }}>
                  {focusedPerk.name.toUpperCase()}
                </h2>
                <div className="menu-separator" style={{ margin: '0.5rem auto', width: '150px' }}></div>
              </div>

              <div style={{ 
                position: 'fixed', 
                top: '65vh', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                textAlign: 'center', 
                zIndex: 700, 
                width: '600px',
                pointerEvents: 'none'
              }}>
                <p className="skyrim-serif" style={{ 
                  color: '#fff', 
                  fontSize: '1.4rem', 
                  margin: '0 0 1.5rem 0', 
                  lineHeight: '1.5',
                  textShadow: '1px 1px 2px #000'
                }}>
                  {focusedPerk.description}
                </p>
                
                <div style={{ pointerEvents: 'auto' }}>
                  {!stats.perks.includes(focusedPerk.id) ? (
                    <button 
                      className="btn-unlock" 
                      disabled={stats.skillPoints <= 0}
                      onClick={() => spendSkillPoint(focusedPerk.id)}
                      style={{ 
                        boxShadow: stats.skillPoints > 0 ? '0 0 20px rgba(230, 194, 120, 0.4)' : 'none'
                      }}
                    >
                      {stats.skillPoints > 0 ? `UNLOCK PERK (1 POINT)` : 'NEED SKILL POINTS'}
                    </button>
                  ) : (
                    <div className="skyrim-font" style={{ color: 'var(--skyrim-gold-bright)', fontSize: '1.2rem', letterSpacing: '2px' }}>
                      [ PERK UNLOCKED ]
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div style={{ position: 'fixed', bottom: '2rem', right: '4rem', zIndex: 1000 }} className="skyrim-font">
             AVAILABLE POINTS: <span style={{ color: '#fff' }}>{stats.skillPoints}</span>
          </div>
        </div>
      )}

      <HUD showCompass={false} showLevel={false} />
    </div>
  );
};

export default Skills;
