import React, { useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useTrackpadSwipe } from '../hooks/useTrackpadSwipe';
import '../styles/Skyrim.css';

interface Spell {
  id: string;
  name: string;
  school: string;
  cost: number;
  description: string;
  effect: string;
  words?: string[]; 
}

const SPELLS: Spell[] = [
  { id: 'heal', name: 'Heal Self', school: 'RESTORATION', cost: 30, description: 'A basic mending of the spirit.', effect: 'Prompts you to list 3 things you like about yourself.' },
  { id: 'calm', name: 'Calm', school: 'ILLUSION', cost: 40, description: 'Soothe the racing mind.', effect: 'Initiates a 60-second deep breathing exercise.' },
  { id: 'transmute', name: 'Transmute Thought', school: 'ALTERATION', cost: 50, description: 'Turn iron worries into golden lessons.', effect: 'AI-powered reframing of a negative thought.' },
  { id: 'familiar', name: 'Summon Familiar', school: 'CONJURATION', cost: 30, description: 'Call upon a trusted ally.', effect: 'Displays a reminder to contact a specific loved one.' },
];

const SHOUTS: Spell[] = [
  { id: 'fus', name: 'Unrelenting Focus', school: 'SHOUTS', cost: 0, words: ['FUS', 'RO', 'DAH'], description: 'Push aside procrastination.', effect: ' old quest surge timer.' },
  { id: 'feim', name: 'Ethereal Peace', school: 'SHOUTS', cost: 0, words: ['FEIM', 'ZII', 'GRON'], description: 'Immune to anxiety.', effect: 'Minimalist Zen mode.' },
  { id: 'tiid', name: 'Slow Time', school: 'SHOUTS', cost: 0, words: ['TIID', 'KLO', 'UL'], description: 'Control flow of day.', effect: 'Pauses notifications.' }
];

const SCHOOLS = ['ALL', 'SHOUTS', 'ALTERATION', 'CONJURATION', 'ILLUSION', 'RESTORATION', 'ACTIVE EFFECTS'];

const Magic: React.FC = () => {
  const { stats, activeEffects, castSpell, notify } = useGame();
  const [selectedSchool, setSelectedSchool] = useState('ALL');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  const allItems = [...SPELLS, ...SHOUTS];
  const filteredItems = selectedSchool === 'ALL' 
    ? allItems 
    : allItems.filter(s => s.school === selectedSchool);

  const handleSwipe = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const currentIndex = SCHOOLS.indexOf(selectedSchool);
    if (direction === 'DOWN') {
      const nextIndex = Math.min(currentIndex + 1, SCHOOLS.length - 1);
      setSelectedSchool(SCHOOLS[nextIndex]);
      setSelectedSpell(null);
    } else if (direction === 'UP') {
      const prevIndex = Math.max(currentIndex - 1, 0);
      setSelectedSchool(SCHOOLS[prevIndex]);
      setSelectedSpell(null);
    }
  }, [selectedSchool]);

  useTrackpadSwipe({ onSwipe: handleSwipe, threshold: 80 });

  const handleCast = (spell: Spell) => {
    if (spell.school === 'SHOUTS') {
      notify("SHOUT UNLEASHED", spell.words?.join(' ') || '');
      return;
    }
    if (castSpell(spell.cost, spell.name)) {
      console.log(`Casting ${spell.name}...`);
    }
  };

  return (
    <div className="skills-container" style={{ background: 'radial-gradient(circle at center, #050a14 0%, #000 100%)' }}>
      <div className="star-field"></div>
      
      <div style={{ marginTop: '100px', height: 'calc(100vh - 250px)', width: '90vw', margin: '100px auto' }}>
        <div className="magic-menu-layout">
          <div className="magic-school-column">
            {SCHOOLS.map(school => (
              <div key={school} className={`magic-list-item ${selectedSchool === school ? 'active' : ''}`} onClick={() => { setSelectedSchool(school); setSelectedSpell(null); }}>
                {school}
              </div>
            ))}
          </div>

          <div className="magic-spell-column">
            <div>
              {selectedSchool === 'ACTIVE EFFECTS' ? (
                <div style={{ padding: '1rem' }}>
                  <div className="quest-category-title" style={{ textAlign: 'right' }}>Active Effects</div>
                  {activeEffects.map(effect => (
                    <div key={effect.id} className="active-effect-card" style={{ flexDirection: 'row-reverse', textAlign: 'right' }}>
                      <div className="active-effect-icon">{effect.icon}</div>
                      <div style={{ marginRight: '1rem' }}>
                        <div className="skyrim-font" style={{ color: '#fff' }}>{effect.name}</div>
                        <div className="skyrim-serif" style={{ color: '#888', fontSize: '0.9rem' }}>{effect.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="quest-category-title" style={{ padding: '1rem', textAlign: 'right' }}>{selectedSchool === 'SHOUTS' ? 'Dragon Shouts' : 'Available Spells'}</div>
                  {filteredItems.map(spell => (
                    <div key={spell.id} className={`magic-list-item ${selectedSpell?.id === spell.id ? 'active' : ''}`} onClick={() => setSelectedSpell(spell)}>
                      <div>{spell.name}</div>
                      {spell.school !== 'SHOUTS' && <div className="spell-cost-indicator">COST {spell.cost}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="magic-details-column">
            {selectedSpell && (
              <div>
                <h1 className="skyrim-font" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{selectedSpell.name}</h1>
                {selectedSpell.school === 'SHOUTS' ? (
                  <div style={{ marginBottom: '1.5rem' }}>{selectedSpell.words?.map(word => <span key={word} className="shout-word">{word}</span>)}</div>
                ) : <div className="skyrim-font" style={{ color: 'var(--skyrim-blue)', marginBottom: '1.5rem' }}>{selectedSpell.school}</div>}
                <div className="menu-separator" style={{ width: '100%', marginBottom: '2rem', opacity: 0.3 }}></div>
                <p className="quest-description" style={{ color: '#fff' }}>{selectedSpell.description}</p>
                <div className="quest-category-title" style={{ marginTop: '2rem' }}>Effect</div>
                <p className="skyrim-serif" style={{ fontSize: '1.2rem', color: '#bbb', fontStyle: 'italic' }}>{selectedSpell.effect}</p>
                <div style={{ marginTop: '4rem' }}>
                  <button className="btn" onClick={() => handleCast(selectedSpell)} disabled={selectedSpell.school !== 'SHOUTS' && stats.magicka < selectedSpell.cost} style={{ background: selectedSpell.school === 'SHOUTS' ? 'rgba(255,255,255,0.1)' : 'var(--skyrim-blue)', border: '1px solid #4a90e2', color: '#fff', padding: '1rem 3rem' }}>
                    {selectedSpell.school === 'SHOUTS' ? 'UNLEASH SHOUT' : 'CAST SPELL'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Magic;
