import React from 'react';
import { useGame } from '../../context/GameContext';
import '../../styles/Skyrim.css';

interface HUDProps {
  showCompass?: boolean;
  showLevel?: boolean;
}

const HUD: React.FC<HUDProps> = ({ 
  showCompass = true, 
  showLevel = true
}) => {
  const { stats, notification, ui, worldMessages } = useGame();

  if (ui.isZenMode) return (
    <>
      {notification && (
        <div className="skyrim-banner">
          <h1 className="banner-text">{notification.title}</h1>
          <div className="menu-separator" style={{ margin: '0.5rem auto', width: '300px' }}></div>
          <p className="banner-subtext">{notification.subtitle}</p>
        </div>
      )}
      <div style={{ position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)', opacity: 0.2 }} className="skyrim-font">
        ETHEREAL PEACE
      </div>
    </>
  );

  const degreeToPixels = 400 / 360;
  // The strip is centered by flexbox. Index 4 (S) is at the center (200px).
  // Index 2 (N) is 200px to the left of Index 4.
  // To bring Index 2 to the center, we need a translateX of +200px.
  const offset = 200 - (ui.heading * degreeToPixels);

  return (
    <>
      <div className="world-messages-container">
        {worldMessages.map(m => (
          <div key={m.id} className="world-message skyrim-font">
            {m.text}
          </div>
        ))}
      </div>

      {notification && (
        <div className="skyrim-banner">
          <h1 className="banner-text">{notification.title}</h1>
          <div className="menu-separator" style={{ margin: '0.5rem auto', width: '300px' }}></div>
          <p className="banner-subtext">{notification.subtitle}</p>
        </div>
      )}

      {showCompass && (
        <div className="compass-container">
          <div className="compass-strip" style={{ transform: `translateX(${offset}px)` }}>
            <div className="compass-mark"><span className="compass-direction">S</span></div>
            <div className="compass-mark"><span className="compass-direction">W</span></div>
            <div className="compass-mark"><span className="compass-direction">N</span></div>
            <div className="compass-mark"><span className="compass-direction">E</span></div>
            <div className="compass-mark"><span className="compass-direction">S</span></div>
            <div className="compass-mark"><span className="compass-direction">W</span></div>
            <div className="compass-mark"><span className="compass-direction">N</span></div>
            <div className="compass-mark"><span className="compass-direction">E</span></div>
            <div className="compass-mark"><span className="compass-direction">S</span></div>
          </div>

          <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {ui.compassMarkers.map(m => (
              <div 
                key={m.id}
                style={{ 
                  position: 'absolute', 
                  left: `calc(50% + ${m.offset}px)`, 
                  top: '50%', 
                  transform: 'translate(-50%, -50%)',
                  fontSize: '0.8rem',
                  filter: 'drop-shadow(0 0 2px #fff)',
                  transition: 'left 0.2s ease-out'
                }}
              >
                {m.icon}
              </div>
            ))}
          </div>

          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '2px', height: '100%', background: '#fff', boxShadow: '0 0 5px #fff', zIndex: 2 }}></div>
        </div>
      )}

      {showLevel && (
        <div className="level-progress-container skyrim-font">
          <div className="level-text">Level {stats.level}</div>
          <div className="xp-bar-bg">
            <div className="xp-bar-fill" style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }}></div>
          </div>
        </div>
      )}

      <div className="hud-container">
        <div className="stat-bar-group"><div className="stat-bar-bg"><div className="stat-bar-fill bar-magicka" style={{ width: `${stats.magicka}%` }}></div></div></div>
        <div className="stat-bar-group"><div className="stat-bar-bg"><div className="stat-bar-fill bar-health" style={{ width: `${stats.health}%` }}></div></div></div>
        <div className="stat-bar-group"><div className="stat-bar-bg"><div className="stat-bar-fill bar-stamina" style={{ width: `${stats.stamina}%` }}></div></div></div>
      </div>
    </>
  );
};

export default HUD;
