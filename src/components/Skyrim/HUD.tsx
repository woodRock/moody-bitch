import React from 'react';
import { useGame } from '../../context/GameContext';
import '../../styles/Skyrim.css';

interface HUDProps {
  showCompass?: boolean;
  showLevel?: boolean;
  heading?: number; // 0 to 360
  compassMarkers?: { id: string, offset: number, icon: string }[];
}

const HUD: React.FC<HUDProps> = ({ 
  showCompass = true, 
  showLevel = true, 
  heading = 0,
  compassMarkers = []
}) => {
  const { stats, notification } = useGame();

  // Heading logic: 
  // We want 'N' to be centered at 0 degrees.
  // Each major mark is 100px wide. 
  // Our strip below starts at 'S', so 'N' is the 3rd item (+200px)
  // We offset by -(heading * degreeToPixels)
  const degreeToPixels = 400 / 360;
  const offset = -(heading * degreeToPixels);

  return (
    <>
      {/* Notification Banner */}
      {notification && (
        <div className="skyrim-banner">
          <h1 className="banner-text">{notification.title}</h1>
          <div className="menu-separator" style={{ margin: '0.5rem auto', width: '300px' }}></div>
          <p className="banner-subtext">{notification.subtitle}</p>
        </div>
      )}

      {/* Top Compass */}
      {showCompass && (
        <div className="compass-container">
          <div className="compass-strip" style={{ transform: `translateX(${offset}px)` }}>
            {/* Extended strip to allow wrapping visual flow. N is the pivot. */}
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

          {/* Compass Markers (Quests/Logs) */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {compassMarkers.map(m => (
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

          {/* Static Center Marker */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '2px', height: '100%', background: '#fff', boxShadow: '0 0 5px #fff', zIndex: 2 }}></div>
        </div>
      )}

      {/* Level / XP Indicator */}
      {showLevel && (
        <div className="level-progress-container skyrim-font">
          <div className="level-text">Level {stats.level}</div>
          <div className="xp-bar-bg">
            <div 
              className="xp-bar-fill" 
              style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Bottom Stats Bars */}
      <div className="hud-container">
        <div className="stat-bar-group">
          <div className="stat-bar-bg">
            <div className="stat-bar-fill bar-magicka" style={{ width: `${stats.magicka}%` }}></div>
          </div>
        </div>
        <div className="stat-bar-group">
          <div className="stat-bar-bg">
            <div className="stat-bar-fill bar-health" style={{ width: `${stats.health}%` }}></div>
          </div>
        </div>
        <div className="stat-bar-group">
          <div className="stat-bar-bg">
            <div className="stat-bar-fill bar-stamina" style={{ width: `${stats.stamina}%` }}></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HUD;
