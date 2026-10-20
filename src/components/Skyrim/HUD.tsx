import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import ShoutMeter from './ShoutMeter';
import Compass from './Compass';
import { useCompass } from '../../context/compassStore';

interface HUDProps {
  showCompass?: boolean;
  showLevel?: boolean;
  compassWidth?: number;
  onCompassClick?: () => void;
  /** Mobile shell renders the bars itself. */
  showBars?: boolean;
}

const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;

const Bar: React.FC<{ cls: string; letter: string; v: number; max: number; name: string; compact: boolean; draining: boolean }> = ({ cls, letter, v, max, name, compact, draining }) => (
  <div className="stat-bar-group" title={`${name} ${v}/${max}`}>
    {compact && <span className="bar-letter skyrim-font" aria-hidden="true">{letter}</span>}
    <div className={`stat-bar-bg ${draining ? 'draining' : ''}`}><div className={`stat-bar-fill ${cls}`} style={{ width: pct(v, max) }} /></div>
  </div>
);

export const StatBars: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { stats } = useGame();
  // Older than an hour since the last log: the bars are quietly draining.
  const draining = stats.vitalsUpdatedAt > 0 && Date.now() - stats.vitalsUpdatedAt > 3_600_000;
  return (
    <div className={`hud-container ${compact ? 'compact' : ''}`} aria-label="Vitals">
      <Bar cls="bar-magicka" letter="M" v={stats.magicka} max={stats.magickaMax} name="Magicka" compact={compact} draining={draining} />
      <Bar cls="bar-health" letter="H" v={stats.health} max={stats.healthMax} name="Health" compact={compact} draining={draining} />
      <Bar cls="bar-stamina" letter="S" v={stats.stamina} max={stats.staminaMax} name="Stamina" compact={compact} draining={draining} />
    </div>
  );
};

export const Banner: React.FC = () => {
  const { notification } = useGame();
  const navigate = useNavigate();
  if (!notification) return null;
  const tappable = !!notification.to;
  return (
    <div className={`skyrim-banner ${tappable ? 'tappable' : ''}`} key={notification.id} role={tappable ? 'button' : 'status'} aria-live="polite" onClick={tappable ? () => navigate(notification.to!) : undefined}>
      {notification.icon && <div className="banner-icon" aria-hidden="true">{notification.icon}</div>}
      <h1 className="banner-text">{notification.title}</h1>
      <div className="menu-separator" style={{ margin: '0.5rem auto', width: 'min(300px, 70vw)' }} />
      {notification.subtitle && <p className="banner-subtext">{notification.subtitle}</p>}
      {tappable && <p className="banner-hint skyrim-font">TAP TO VIEW</p>}
    </div>
  );
};

const HUD: React.FC<HUDProps> = ({ showCompass = true, showLevel = false, compassWidth = 400, onCompassClick, showBars = true }) => {
  const { stats, worldMessages } = useGame();
  const compass = useCompass();
  const isSlowTime = stats.slowTimeEndTime > Date.now();

  if (stats.zenMode) return <Banner />;

  return (
    <>
      {isSlowTime && <div className="slow-time-indicator skyrim-font">SLOW TIME ACTIVE</div>}

      <div className="world-messages-container" aria-live="polite">
        {worldMessages.map(m => <div key={m.id} className="world-message skyrim-font">{m.text}</div>)}
      </div>

      <Banner />

      {showCompass && (
        <div className="compass-anchor">
          <Compass heading={compass.heading} markers={compass.markers} width={compassWidth} onClick={onCompassClick} title={onCompassClick ? 'Open the map' : undefined} />
        </div>
      )}

      {showLevel && (
        <div className="level-progress-container skyrim-font">
          <div className="level-text">Level {stats.level}</div>
          <div className="xp-bar-bg"><div className="xp-bar-fill" style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }} /></div>
        </div>
      )}

      {showBars && <StatBars />}
      <ShoutMeter />
    </>
  );
};

export default HUD;
