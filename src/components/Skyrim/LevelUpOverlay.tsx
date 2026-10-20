import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import type { Attribute } from '../../game/types';

const COLORS: Record<Attribute, string> = { magicka: '#3d8de0', health: '#e05a4e', stamina: '#3fae3c' };

/** Skyrim's level-up screen: pick Magicka, Health or Stamina. Shown wherever you are when a level is waiting. */
const LevelUpOverlay: React.FC<{ open: boolean }> = ({ open }) => {
  const { stats, advanceLevel, setUI } = useGame();
  const { playSound } = useSound();

  useEffect(() => {
    if (!open) return;
    playSound('LEVEL_UP');
    setUI({ levelUpShowing: true });
    return () => setUI({ levelUpShowing: false });
  }, [open, playSound, setUI]);

  const max = (a: Attribute) => (a === 'magicka' ? stats.magickaMax : a === 'health' ? stats.healthMax : stats.staminaMax);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="skyrim-modal-overlay opaque levelup" role="dialog" aria-modal="true" aria-label="Level up">
          <div className="levelup-inner">
            <h1 className="skyrim-font levelup-title">LEVEL UP!</h1>
            <p className="skyrim-serif levelup-sub">CHOOSE AN ATTRIBUTE TO ADVANCE · LEVEL {stats.level + 1}</p>
            <div className="levelup-choices">
              {(['magicka', 'health', 'stamina'] as const).map(attr => (
                <button key={attr} onClick={() => void advanceLevel(attr)} className="levelup-choice skyrim-font" style={{ color: COLORS[attr] }}>
                  <div className="levelup-current">{max(attr)}</div>
                  <div className="levelup-name">{attr.toUpperCase()}</div>
                  <div className="levelup-delta">+10</div>
                </button>
              ))}
            </div>
            {stats.pendingLevelUps > 1 && <p className="skyrim-font levelup-pending">{stats.pendingLevelUps} LEVELS WAITING</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpOverlay;
