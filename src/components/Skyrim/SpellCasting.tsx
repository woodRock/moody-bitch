import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import { useGame } from '../../context/GameContext';
import { reframeThought } from '../../services/loreService';
import { LIMITS, XP } from '../../game/rules';
import type { Spell } from '../../game/spells';

interface Props {
  spell: Spell['id'] | null;
  onDone: () => void;
}

const BREATH: { step: 'In' | 'Hold' | 'Out'; ms: number }[] = [
  { step: 'In', ms: 4000 }, { step: 'Hold', ms: 7000 }, { step: 'Out', ms: 8000 },
];
const ROUNDS = 3;

/** The interactive part of each spell, shared by desktop and mobile. */
const SpellCasting: React.FC<Props> = ({ spell, onDone }) => {
  const { grantXP, notify, restore } = useGame();
  const [gratitudes, setGratitudes] = useState(['', '', '']);
  const [breath, setBreath] = useState<{ idx: number; round: number }>({ idx: 0, round: 1 });
  const [thought, setThought] = useState('');
  const [lesson, setLesson] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (spell !== 'calm') return;
    setBreath({ idx: 0, round: 1 });
    let idx = 0, round = 1;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        idx += 1;
        if (idx >= BREATH.length) { idx = 0; round += 1; }
        if (round > ROUNDS) {
          notify('SOOTHED', 'Your mind is clear.');
          void grantXP([{ amount: XP.SPELL_CALM, skill: 'ALTERATION' }]);
          onDone();
          return;
        }
        setBreath({ idx, round });
        next();
      }, BREATH[idx].ms);
    };
    next();
    return () => clearTimeout(timer);
    // Only restart the exercise when the spell changes, never on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spell]);

  const finishHeal = () => {
    if (!gratitudes.every(g => g.trim().length > 2)) return;
    notify('SPIRIT MENDED', '+25 HEALTH');
    void restore({ health: 25 });
    void grantXP([{ amount: XP.SPELL_HEAL, skill: 'RESTORATION' }]);
    setGratitudes(['', '', '']);
    onDone();
  };

  const forge = async () => {
    if (!thought.trim() || working) return;
    setWorking(true);
    try { setLesson(await reframeThought(thought)); } finally { setWorking(false); }
  };

  const collect = () => {
    void grantXP([{ amount: XP.SPELL_TRANSMUTE, skill: 'ALTERATION' }]);
    setThought(''); setLesson('');
    onDone();
  };

  const current = BREATH[breath.idx];
  const scale = current.step === 'Out' ? 1 : 1.5;

  return (
    <>
      <Modal open={spell === 'heal'} onClose={onDone} title="MEND SPIRIT" width={560}>
        <p className="skyrim-serif modal-lead">List three things you value about your journey today.</p>
        {gratitudes.map((g, i) => (
          <input key={i} className="parchment-input dark" style={{ marginBottom: '0.8rem' }} placeholder={`Blessing ${i + 1}...`} value={g} maxLength={LIMITS.HIGHLIGHT}
            onChange={e => setGratitudes(gs => gs.map((v, j) => (j === i ? e.target.value : v)))} aria-label={`Blessing ${i + 1}`} />
        ))}
        <div className="form-actions">
          <button className="btn-primary skyrim-font" onClick={finishHeal} disabled={!gratitudes.every(g => g.trim().length > 2)}>RESTORE HEALTH</button>
        </div>
      </Modal>

      <Modal open={spell === 'calm'} onClose={onDone} opaque width="100%" className="borderless">
        <div className="breathing" aria-live="polite">
          <motion.div className="breathing-orb" animate={{ scale }} transition={{ duration: current.ms / 1000, ease: 'easeInOut' }} />
          <h1 className="skyrim-font breathing-word">{current.step.toUpperCase()}</h1>
          <p className="skyrim-serif breathing-sub">Round {breath.round} of {ROUNDS} · Release the weight of the realm...</p>
          <button className="btn-ghost skyrim-font" onClick={onDone}>END EARLY</button>
        </div>
      </Modal>

      <Modal open={spell === 'transmute'} onClose={onDone} title="THOUGHT FORGE" width={640}>
        {!lesson ? (
          <>
            <p className="skyrim-serif modal-lead">Place your leaden worry into the fire...</p>
            <textarea className="parchment-input dark" rows={4} maxLength={LIMITS.THOUGHT} placeholder="What weighs on your soul?" value={thought} onChange={e => setThought(e.target.value)} aria-label="Your thought" />
            <div className="form-actions">
              <button className="btn-primary skyrim-font" onClick={forge} disabled={working || !thought.trim()}>{working ? 'TRANSMUTING...' : 'FORGE GOLDEN LESSON'}</button>
            </div>
          </>
        ) : (
          <div>
            <p className="skyrim-serif lesson-text">“{lesson}”</p>
            <div className="form-actions"><button className="btn-primary skyrim-font" onClick={collect}>COLLECT WISDOM</button></div>
          </div>
        )}
      </Modal>

      <Modal open={spell === 'familiar'} onClose={onDone} title="SUMMON ALLY" width={480}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '0.5rem' }}>🦅</div>
          <p className="skyrim-serif modal-lead">A true Dragonborn never walks alone.</p>
          <p className="skyrim-serif muted">Send a message to a trusted friend or ally in the physical realm.</p>
          <div className="form-actions">
            <button className="btn-primary skyrim-font" onClick={() => { void grantXP([{ amount: XP.SPELL_FAMILIAR, skill: 'SPEECH' }]); onDone(); }}>I SHALL REACH OUT</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SpellCasting;
