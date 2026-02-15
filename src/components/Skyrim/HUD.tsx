import React from 'react';
import { useGame } from '../../context/GameContext';
import '../../styles/Skyrim.css';

interface HUDProps {
  showCompass?: boolean;
  showLevel?: boolean;
}

const HUD: React.FC<HUDProps> = ({ showCompass = true, showLevel = true }) => {
  const { stats, notification } = useGame();

  return (
    <>
      {/* Notification Banner ... */}
      {notification && (
        <div className="skyrim-banner">
          <h1 className="banner-text">{notification.title}</h1>
          <div className="menu-separator" style={{ margin: '0.5rem auto', width: '300px' }}></div>
          <p className="banner-subtext">{notification.subtitle}</p>
        </div>
      )}

      {/* Top Compass ... */}
      {showCompass && (
        <div className="compass-container">
          <div className="compass-direction">W</div>
          <div className="compass-tick"></div>
          <div className="compass-tick"></div>
          <div className="compass-direction">N</div>
          <div className="compass-tick"></div>
          <div className="compass-tick"></div>
          <div className="compass-direction">E</div>
        </div>
      )}

      {/* Level / XP Indicator (Top Right) */}
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
        {/* Magicka (Left) - Maps to Sleep/Rest */}
        <div className="stat-bar-group">
          <div className="stat-bar-bg">
            <div className="stat-bar-fill bar-magicka" style={{ width: `${stats.magicka}%` }}></div>
          </div>
        </div>

        {/* Health (Middle) - Maps to Mood */}
        <div className="stat-bar-group">
          <div className="stat-bar-bg">
            <div className="stat-bar-fill bar-health" style={{ width: `${stats.health}%` }}></div>
          </div>
        </div>

        {/* Stamina (Right) - Maps to Energy */}
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
