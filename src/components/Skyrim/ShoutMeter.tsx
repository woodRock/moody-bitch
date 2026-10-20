import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { SHOUT_COOLDOWN_MS } from '../../game/rules';

/** The Voice recharging, as in the game: visible only while a shout is on cooldown. */
const ShoutMeter: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { stats } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const until = stats.shoutCooldownUntil;
  const active = until > now;

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;
  const left = until - now;
  const pct = Math.max(0, Math.min(100, 100 - (left / SHOUT_COOLDOWN_MS) * 100));
  const s = Math.ceil(left / 1000);

  return (
    <div className={`shout-meter ${compact ? 'compact' : ''}`} aria-label={`Voice recharging, ${s} seconds`}>
      <span className="skyrim-font">VOICE</span>
      <div className="shout-meter-track"><div className="shout-meter-fill" style={{ width: `${pct}%` }} /></div>
      <span className="skyrim-font shout-meter-time">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>
    </div>
  );
};

export default ShoutMeter;
