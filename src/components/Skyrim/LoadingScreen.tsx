import React, { useEffect, useState } from 'react';
import { LORE_TIPS } from '../../game/spells';

/**
 * The Skyrim loading screen. Pure CSS animation so it needs no animation
 * library on the first paint; it fades out once the realm is ready.
 */
const LoadingScreen: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [tip, setTip] = useState(LORE_TIPS[0]);
  const [mounted, setMounted] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setTip(LORE_TIPS[Math.floor(Math.random() * LORE_TIPS.length)]);
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 900);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (!mounted) return null;

  return (
    <div className={`loading-screen ${isLoading ? '' : 'fade-out'}`} aria-busy={isLoading} aria-live="polite">
      <div className="loading-scene">
        <div className="loading-cube spin">
          <div className="face cube-front">✨</div>
          <div className="face cube-back">💎</div>
          <div className="face cube-left">📜</div>
          <div className="face cube-right">🍷</div>
          <div className="face cube-top">⚔️</div>
          <div className="face cube-bottom">🛡️</div>
        </div>
      </div>

      <div className="loading-tip">
        <h2 className="skyrim-font">DID YOU KNOW?</h2>
        <p className="skyrim-serif">“{tip}”</p>
      </div>

      <div className="loading-bar">
        <div className="skyrim-font loading-bar-label">LOADING REALM...</div>
        <div className="loading-bar-track"><div className="loading-bar-fill grow" /></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
