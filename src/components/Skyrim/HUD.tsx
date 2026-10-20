import React from 'react';
import { useGame } from '../../context/GameContext';
import Compass from './Compass';

interface HUDProps {
  showCompass?: boolean;
  showLevel?: boolean;
  compassWidth?: number;
  onCompassClick?: () => void;
  /** Mobile shell renders the bars itself. */
  showBars?: boolean;
}

export const StatBars: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { stats } = useGame();
  const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  return (
    <div className={`hud-container ${compact ? 'compact' : ''}`} aria-hidden="true">
      <div className="stat-bar-group"><div className="stat-bar-bg"><div className="stat-bar-fill bar-magicka" style={{ width: pct(stats.magicka, stats.magickaMax) }} /></div></div>
      <div className="stat-bar-group"><div className="stat-bar-bg"><div className="stat-bar-fill bar-health" style={{ width: pct(stats.health, stats.healthMax) }} /></div></div>
      <div className="stat-bar-group"><div className="stat-bar-bg"><div className="stat-bar-fill bar-stamina" style={{ width: pct(stats.stamina, stats.staminaMax) }} /></div></div>
    </div>
  );
};

export const Banner: React.FC = () => {
  const { notification } = useGame();
  if (!notification) return null;
  return (
    <div className="skyrim-banner" key={notification.id} role="status" aria-live="polite">
      <h1 className="banner-text">{notification.title}</h1>
      <div className="menu-separator" style={{ margin: '0.5rem auto', width: 'min(300px, 70vw)' }} />
      {notification.subtitle && <p className="banner-subtext">{notification.subtitle}</p>}
    </div>
  );
};

const HUD: React.FC<HUDProps> = ({ showCompass = true, showLevel = false, compassWidth = 400, onCompassClick, showBars = true }) => {
  const { stats, ui, worldMessages } = useGame();
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
          <Compass heading={ui.heading} markers={ui.compassMarkers} width={compassWidth} onClick={onCompassClick} title={onCompassClick ? 'Open the map' : undefined} />
        </div>
      )}

      {showLevel && (
        <div className="level-progress-container skyrim-font">
          <div className="level-text">Level {stats.level}</div>
          <div className="xp-bar-bg"><div className="xp-bar-fill" style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }} /></div>
        </div>
      )}

      {showBars && <StatBars />}
    </>
  );
};

export default HUD;
