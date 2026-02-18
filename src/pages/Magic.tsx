import React, { useState, useCallback, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import { useTrackpadSwipe } from '../hooks/useTrackpadSwipe';
import { motion, AnimatePresence } from 'framer-motion';
import { generateQuestLore } from '../services/loreService'; 
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
  { 
    id: 'fus', 
    name: 'Unrelenting Focus', 
    school: 'SHOUTS', 
    cost: 0, 
    words: ['FUS', 'RO', 'DAH'], 
    description: 'Force your will upon the world and crush procrastination. A powerful shout that focuses your spirit for a brief period of intense productivity.', 
    effect: 'Quests completed within the next 5 minutes grant double XP.' 
  },
  { 
    id: 'feim', 
    name: 'Ethereal Peace', 
    school: 'SHOUTS', 
    cost: 0, 
    words: ['FEIM', 'ZII', 'GRON'], 
    description: 'Enter a state of ethereal calm where the distractions of the world fade away. This shout grants immunity to the anxieties of the UI.', 
    effect: 'Toggles Zen Mode: Hides all HUD elements for a minimalist experience.' 
  },
  { id: 'tiid', name: 'Slow Time', school: 'SHOUTS', cost: 0, words: ['TIID', 'KLO', 'UL'], description: 'Control flow of day.', effect: 'Pauses notifications.' }
];

const SCHOOLS = ['ALL', 'SHOUTS', 'ALTERATION', 'CONJURATION', 'ILLUSION', 'RESTORATION', 'ACTIVE EFFECTS'];

const Magic: React.FC = () => {
  const { stats, activeEffects, castSpell, notify, setUI, addXP, startSurge, ui } = useGame();
  const { playSound } = useSound();
  const [selectedSchool, setSelectedSchool] = useState('ALL');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  const [isCasting, setIsCasting] = useState<string | null>(null);
  const [gratitudes, setGratitudes] = useState(['', '', '']);
  const [breathingStep, setBreathingStep] = useState<'In' | 'Hold' | 'Out'>('In');
  const [negativeThought, setNegativeThought] = useState('');
  const [transmutedThought, setTransmutedThought] = useState('');
  const [isTransmuting, setIsTransmuting] = useState(false);

  const handleSwipe = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (isCasting) return;
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
  }, [selectedSchool, isCasting]);

  useTrackpadSwipe({ onSwipe: handleSwipe, threshold: 80 });

  const handleCast = (spell: Spell) => {
    if (spell.school === 'SHOUTS') {
      notify("SHOUT UNLEASHED", spell.words?.join(' ') || '');
      playSound('SPELL_CAST');
      if (spell.id === 'fus') {
        startSurge(5);
      } else if (spell.id === 'feim') {
        setUI({ isZenMode: !ui.isZenMode });
        notify(ui.isZenMode ? "SPIRIT DISTURBED" : "ETHEREAL PEACE", ui.isZenMode ? "World returns to focus." : "Calm and quiet in the mind.");
      }
      return;
    }
    if (castSpell(spell.cost, spell.name)) {
      setIsCasting(spell.id);
    }
  };

  useEffect(() => {
    if (isCasting !== 'calm') return;
    let timer: any;
    const runBreath = () => {
      setBreathingStep('In');
      timer = setTimeout(() => {
        setBreathingStep('Hold');
        timer = setTimeout(() => {
          setBreathingStep('Out');
          timer = setTimeout(() => {
            setIsCasting(null);
            notify("SOOTHED", "Your mind is clear.");
            addXP(50, 'ALTERATION');
          }, 8000);
        }, 7000);
      }, 4000);
    };
    runBreath();
    return () => clearTimeout(timer);
  }, [isCasting, notify, addXP]);

  const finalizeHeal = () => {
    if (gratitudes.every(g => g.trim().length > 2)) {
      setIsCasting(null);
      notify("SPIRIT MENDED", "Health restored.");
      addXP(50, 'RESTORATION');
      setGratitudes(['', '', '']);
    }
  };

  const handleTransmute = async () => {
    if (!negativeThought.trim()) return;
    setIsTransmuting(true);
    try {
      const prompt = `Reframe this negative thought into a constructive, positive lesson in the style of a wise Skyrim mage: "${negativeThought}"`;
      const result = await generateQuestLore(prompt, 'one-off'); 
      setTransmutedThought(result);
    } catch (e) {
      setTransmutedThought("The stars are cloudy. Try again later.");
    } finally {
      setIsTransmuting(false);
    }
  };

  return (
    <div className="skills-container" style={{ background: 'radial-gradient(circle at center, #050a14 0%, #000 100%)' }}>
      <div className="star-field"></div>

      <button 
        onClick={() => { setUI({ isMenuOpen: true }); playSound('UI_CLICK'); }}
        className="skyrim-font"
        style={{ position: 'fixed', top: '2rem', right: '4rem', background: 'none', border: 'none', color: 'var(--skyrim-gold-bright)', fontSize: '3rem', cursor: 'pointer', zIndex: 100, opacity: 0.6 }}
      >
        &rarr;
      </button>
      
      <div style={{ marginTop: '100px', height: 'calc(100vh - 250px)', width: '90vw', margin: '100px auto' }}>
        <div className="magic-menu-layout">
          <div className="magic-school-column">
            {SCHOOLS.map(school => (
              <div key={school} className={`magic-list-item ${selectedSchool === school ? 'active' : ''}`} onClick={() => { setSelectedSchool(school); setSelectedSpell(null); playSound('UI_CLICK'); }}>
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
                  {([...SPELLS, ...SHOUTS]).filter(s => selectedSchool === 'ALL' || s.school === selectedSchool).map(spell => (
                    <div key={spell.id} className={`magic-list-item ${selectedSpell?.id === spell.id ? 'active' : ''}`} onClick={() => { setSelectedSpell(spell); playSound('UI_CLICK'); }}>
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

      <AnimatePresence>
        {isCasting === 'heal' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="skyrim-modal-overlay">
            <div className="skyrim-modal-content" style={{ width: '600px', textAlign: 'center' }}>
              <h2 className="skyrim-title">MEND SPIRIT</h2>
              <p className="skyrim-serif" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>List three things you value about your journey today.</p>
              {gratitudes.map((g, i) => (
                <input key={i} className="parchment-input" style={{ marginBottom: '1rem', width: '100%' }} placeholder={`Blessing ${i+1}...`} value={g} onChange={e => {
                  const n = [...gratitudes]; n[i] = e.target.value; setGratitudes(n);
                }} />
              ))}
              <button className="btn" style={{ marginTop: '1rem', width: '100%' }} onClick={finalizeHeal}>RESTORE HEALTH</button>
            </div>
          </motion.div>
        )}

        {isCasting === 'calm' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="skyrim-modal-overlay" style={{ background: 'rgba(0,0,0,0.95)' }}>
            <div style={{ textAlign: 'center' }}>
              <motion.div 
                animate={{ scale: breathingStep === 'In' ? 1.5 : (breathingStep === 'Hold' ? 1.5 : 1) }}
                transition={{ duration: breathingStep === 'In' ? 4 : (breathingStep === 'Out' ? 8 : 0) }}
                style={{ width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, var(--skyrim-blue), transparent)', border: '2px solid #fff', margin: '0 auto 2rem' }}
              />
              <h1 className="skyrim-font" style={{ fontSize: '4rem', color: '#fff' }}>{breathingStep.toUpperCase()}</h1>
              <p className="skyrim-serif" style={{ fontSize: '1.5rem', color: 'var(--skyrim-blue)' }}>Release the weight of the realm...</p>
            </div>
          </motion.div>
        )}

        {isCasting === 'transmute' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="skyrim-modal-overlay">
            <div className="skyrim-modal-content" style={{ width: '700px' }}>
              <h2 className="skyrim-title">THOUGHT FORGE</h2>
              {!transmutedThought ? (
                <>
                  <p className="skyrim-serif" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Place your leaden worry into the fire...</p>
                  <textarea className="parchment-input" style={{ width: '100%', height: '100px', marginBottom: '1rem' }} placeholder="What weighs on your soul?" value={negativeThought} onChange={e => setNegativeThought(e.target.value)} />
                  <button className="btn" style={{ width: '100%' }} onClick={handleTransmute} disabled={isTransmuting}>{isTransmuting ? 'TRANSMUTING...' : 'FORGE GOLDEN LESSON'}</button>
                </>
              ) : (
                <div style={{ animation: 'zoom-in 0.5s' }}>
                  <p className="skyrim-serif" style={{ fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--skyrim-gold-bright)', marginBottom: '2rem' }}>"{transmutedThought}"</p>
                  <button className="btn" style={{ width: '100%' }} onClick={() => { setIsCasting(null); setTransmutedThought(''); setNegativeThought(''); addXP(100, 'ALTERATION'); }}>COLLECT WISDOM</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {isCasting === 'familiar' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="skyrim-modal-overlay">
            <div className="skyrim-modal-content" style={{ textAlign: 'center' }}>
              <h2 className="skyrim-title">SUMMON ALLY</h2>
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🦅</div>
              <p className="skyrim-serif" style={{ fontSize: '1.4rem' }}>A true Dragonborn never walks alone.</p>
              <p className="skyrim-serif" style={{ color: '#888', marginBottom: '2rem' }}>Send a message to a trusted friend or ally in the physical realm.</p>
              <button className="btn" style={{ width: '100%' }} onClick={() => { setIsCasting(null); addXP(30, 'CONJURATION'); }}>I SHALL REACH OUT</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Magic;
