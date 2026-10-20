import React from 'react';
import { useGame } from '../../context/GameContext';
import { STONES, STONE_COOLDOWN_MS } from '../../game/stones';

/** Choose the sign you are born under this week. */
const StandingStones: React.FC = () => {
  const { stats, setStandingStone } = useGame();
  const since = Date.now() - stats.stoneChangedAt;
  const locked = !!stats.standingStone && since < STONE_COOLDOWN_MS;
  const daysLeft = Math.max(1, Math.ceil((STONE_COOLDOWN_MS - since) / 86_400_000));

  return (
    <div className="stones">
      <div className="stones-head">
        <div className="quest-category-title" style={{ margin: 0 }}>Standing Stone</div>
        <span className="skyrim-serif muted small">{locked ? `Bound for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}` : 'Choose a sign for the week'}</span>
      </div>
      <div className="stones-grid">
        {STONES.map(s => {
          const active = stats.standingStone === s.id;
          return (
            <button key={s.id} className={`stone ${active ? 'active' : ''}`} disabled={!active && locked} onClick={() => void setStandingStone(s.id)} aria-pressed={active}>
              <span className="stone-icon" aria-hidden="true">{s.icon}</span>
              <span className="stone-name skyrim-font">{s.name.replace('The ', '').replace(' Stone', '')}</span>
              <span className="stone-desc skyrim-serif">{s.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StandingStones;
