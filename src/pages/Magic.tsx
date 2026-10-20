import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import { SCHOOLS, SHOUTS, SPELLS } from '../game/spells';
import type { Spell } from '../game/spells';
import SpellCasting from '../components/Skyrim/SpellCasting';
import { useSpellbook } from '../hooks/useSpellbook';

const Magic: React.FC = () => {
  const { stats, activeEffects, setUI } = useGame();
  const { playSound } = useSound();
  const [selectedSchool, setSelectedSchool] = useState<typeof SCHOOLS[number]>('ALL');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const { casting, setCasting, cast } = useSpellbook();

  const list = [...SPELLS, ...SHOUTS].filter(s => selectedSchool === 'ALL' || s.school === selectedSchool);

  return (
    <div className="skills-container magic-screen">
      <div className="star-field" />
      <button onClick={() => { setUI({ isMenuOpen: true }); playSound('UI_CLICK'); }} className="nav-arrow right-top" aria-label="Open character menu">&rarr;</button>

      <div className="three-column-frame">
        <div className="magic-menu-layout">
          <div className="magic-school-column">
            {SCHOOLS.map(school => (
              <div key={school} className={`magic-list-item ${selectedSchool === school ? 'active' : ''}`} onClick={() => { setSelectedSchool(school); setSelectedSpell(null); playSound('UI_CLICK'); }}>
                {school}
              </div>
            ))}
          </div>

          <div className="magic-spell-column">
            {selectedSchool === 'ACTIVE EFFECTS' ? (
              <div style={{ padding: '1rem' }}>
                <div className="quest-category-title" style={{ textAlign: 'right' }}>Active Effects</div>
                {activeEffects.length === 0 && <p className="skyrim-serif muted" style={{ textAlign: 'right' }}>No effects. Rest well and keep your bars high.</p>}
                {activeEffects.map(effect => (
                  <div key={effect.id} className="active-effect-card reverse">
                    <div className="active-effect-icon">{effect.icon}</div>
                    <div>
                      <div className="skyrim-font" style={{ color: '#fff' }}>{effect.name}</div>
                      <div className="skyrim-serif muted">{effect.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="quest-category-title" style={{ padding: '1rem', textAlign: 'right' }}>{selectedSchool === 'SHOUTS' ? 'Dragon Shouts' : 'Available Spells'}</div>
                {list.map(spell => (
                  <div key={spell.id} className={`magic-list-item ${selectedSpell?.id === spell.id ? 'active' : ''}`} onClick={() => { setSelectedSpell(spell); playSound('UI_CLICK'); }}>
                    <div>{spell.name}</div>
                    {spell.school !== 'SHOUTS' && <div className="spell-cost-indicator">COST {spell.cost}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="magic-details-column">
            {selectedSpell ? (
              <div>
                <h1 className="skyrim-font detail-title">{selectedSpell.name}</h1>
                {selectedSpell.school === 'SHOUTS'
                  ? <div style={{ marginBottom: '1.5rem' }}>{selectedSpell.words?.map(w => <span key={w} className="shout-word">{w}</span>)}</div>
                  : <div className="skyrim-font" style={{ color: 'var(--skyrim-blue-bright)', marginBottom: '1.5rem' }}>{selectedSpell.school}</div>}
                <div className="menu-separator wide" />
                <p className="quest-description" style={{ color: '#fff' }}>{selectedSpell.description}</p>
                <div className="quest-category-title" style={{ marginTop: '2rem' }}>Effect</div>
                <p className="skyrim-serif effect-text">{selectedSpell.effect}</p>
                <div style={{ marginTop: '3rem' }}>
                  <button className={`btn-primary skyrim-font ${selectedSpell.school === 'SHOUTS' ? '' : 'blue'}`} onClick={() => void cast(selectedSpell)} disabled={selectedSpell.school !== 'SHOUTS' && stats.magicka < selectedSpell.cost}>
                    {selectedSpell.school === 'SHOUTS' ? 'UNLEASH SHOUT' : 'CAST SPELL'}
                  </button>
                  {selectedSpell.school !== 'SHOUTS' && stats.magicka < selectedSpell.cost && <p className="skyrim-serif muted" style={{ marginTop: '0.8rem' }}>Not enough Magicka. Rest, or drink a potion.</p>}
                </div>
              </div>
            ) : <p className="skyrim-serif muted" style={{ marginTop: '4rem', textAlign: 'center' }}>Select a spell or shout.</p>}
          </div>
        </div>
      </div>

      <SpellCasting spell={casting} onDone={() => setCasting(null)} />
    </div>
  );
};

export default Magic;
