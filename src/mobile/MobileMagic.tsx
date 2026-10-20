import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import { useSpellbook } from '../hooks/useSpellbook';
import { SHOUTS, SPELLS } from '../game/spells';
import type { Spell } from '../game/spells';
import Modal from '../components/Skyrim/Modal';
import SpellCasting from '../components/Skyrim/SpellCasting';

const MobileMagic: React.FC = () => {
  const { stats, activeEffects } = useGame();
  const { playSound } = useSound();
  const { casting, setCasting, cast } = useSpellbook();
  const [open, setOpen] = useState<Spell | null>(null);

  const Row: React.FC<{ s: Spell }> = ({ s }) => {
    const affordable = s.school === 'SHOUTS' || stats.magicka >= s.cost;
    return (
      <button className={`m-spell ${affordable ? '' : 'dim'}`} onClick={() => { setOpen(s); playSound('UI_CLICK'); }}>
        <div>
          <div className="skyrim-font">{s.name}</div>
          <div className="skyrim-serif muted small">{s.school === 'SHOUTS' ? s.words?.join(' ') : s.description}</div>
        </div>
        <span className="spell-cost-indicator skyrim-font">{s.school === 'SHOUTS' ? 'SHOUT' : `${s.cost} MP`}</span>
      </button>
    );
  };

  return (
    <div className="m-page">
      <div className="m-page-head">
        <h1 className="skyrim-font">MAGIC</h1>
        <span className="skyrim-serif muted" style={{ color: '#3d8de0' }}>Magicka {stats.magicka}/{stats.magickaMax}</span>
      </div>

      <div className="quest-category-title">Spells</div>
      {SPELLS.map(s => <Row key={s.id} s={s} />)}
      <div className="quest-category-title" style={{ marginTop: '1rem' }}>Dragon Shouts</div>
      {SHOUTS.map(s => <Row key={s.id} s={s} />)}

      <div className="quest-category-title" style={{ marginTop: '1rem' }}>Active Effects</div>
      {activeEffects.length === 0 && <p className="skyrim-serif muted">No effects. Rest well and keep your bars high.</p>}
      {activeEffects.map(e => (
        <div key={e.id} className="active-effect-card">
          <div className="active-effect-icon">{e.icon}</div>
          <div><div className="skyrim-font">{e.name}</div><div className="skyrim-serif muted small">{e.description}</div></div>
        </div>
      ))}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name} className="sheet">
        {open && (
          <>
            {open.school === 'SHOUTS'
              ? <div style={{ marginBottom: '1rem' }}>{open.words?.map(w => <span key={w} className="shout-word">{w}</span>)}</div>
              : <div className="skyrim-font" style={{ color: '#3d8de0', marginBottom: '1rem' }}>{open.school} · {open.cost} MAGICKA</div>}
            <p className="quest-description">{open.description}</p>
            <div className="quest-category-title">Effect</div>
            <p className="skyrim-serif effect-text">{open.effect}</p>
            <div className="form-actions">
              <button className="btn-primary skyrim-font blue" disabled={open.school !== 'SHOUTS' && stats.magicka < open.cost} onClick={() => { const s = open; setOpen(null); void cast(s); }}>
                {open.school === 'SHOUTS' ? 'UNLEASH SHOUT' : 'CAST SPELL'}
              </button>
            </div>
          </>
        )}
      </Modal>

      <SpellCasting spell={casting} onDone={() => setCasting(null)} />
    </div>
  );
};

export default MobileMagic;
