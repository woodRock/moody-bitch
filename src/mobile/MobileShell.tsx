import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import { useDeviceHeading } from '../hooks/useDeviceHeading';
import { Banner, StatBars } from '../components/Skyrim/HUD';
import Compass from '../components/Skyrim/Compass';
import { compassStore, useCompass } from '../context/compassStore';
import Modal from '../components/Skyrim/Modal';
import { SystemSettings } from '../components/Skyrim/PauseMenu';
import LevelUpOverlay from '../components/Skyrim/LevelUpOverlay';
import ShoutMeter from '../components/Skyrim/ShoutMeter';
import '../styles/Mobile.css';

const TABS = [
  { to: '/today', label: 'TODAY', icon: '☀' },
  { to: '/quests', label: 'QUESTS', icon: '◆' },
  { to: '/skills', label: 'SKILLS', icon: '✦' },
  { to: '/magic', label: 'MAGIC', icon: '✧' },
  { to: '/inventory', label: 'ITEMS', icon: '⚱' },
];

/**
 * The phone "satellite": the same character, quests and chronicles with a
 * thumb-friendly tab bar instead of trackpad gestures and the diamond menu.
 */
const MobileShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { stats, worldMessages, ui, statsLoaded } = useGame();
  const compass = useCompass();
  const { playSound } = useSound();
  const navigate = useNavigate();
  const location = useLocation();
  const [systemOpen, setSystemOpen] = useState(false);
  const [compassLive, setCompassLive] = useState(false);
  const { heading, permission, requestPermission } = useDeviceHeading(compassLive);

  const onMap = location.pathname === '/dashboard';
  React.useEffect(() => { setSystemOpen(false); }, [location.pathname]);
  const liveHeading = compassLive && heading !== null ? heading : compass.heading;
  const compassWidth = Math.min(300, (typeof window !== 'undefined' ? window.innerWidth : 360) - 150);

  const handleCompass = async () => {
    playSound('UI_CLICK');
    if (!onMap) { navigate('/dashboard'); return; }
    // On the map, tapping the compass lets it follow the phone's real heading.
    if (!compassLive) {
      if (permission !== 'granted') await requestPermission();
      setCompassLive(true);
    } else {
      setCompassLive(false);
      compassStore.set({ heading: 0 });
    }
  };

  // Feed the real heading into the shared UI state so compass markers rotate with it.
  React.useEffect(() => {
    if (compassLive && heading !== null) compassStore.set({ heading });
  }, [compassLive, heading]);

  return (
    <div className={`mobile-shell ${stats.zenMode ? 'zen' : ''}`}>
      <header className="mobile-top">
        <button className="mobile-system skyrim-font" onClick={() => { setSystemOpen(true); playSound('UI_CLICK'); }} aria-label="System menu">☰</button>
        {!stats.zenMode && (
          <Compass heading={liveHeading} markers={compass.markers} width={compassWidth} onClick={() => void handleCompass()} title={onMap ? (compassLive ? 'Stop following the horizon' : 'Follow the real horizon') : 'Open the map'} />
        )}
        <div className="mobile-level skyrim-font" onClick={() => navigate('/skills')} role="button" aria-label={`Level ${stats.level}`}>
          <span className={stats.pendingLevelUps > 0 ? 'gold' : ''}>{stats.pendingLevelUps > 0 ? 'LVL UP' : `LVL ${stats.level}`}</span>
          <div className="xp-bar-bg"><div className="xp-bar-fill" style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }} /></div>
        </div>
      </header>

      {!stats.zenMode && worldMessages.length > 0 && (
        <div className="mobile-world-messages" aria-live="polite">
          {worldMessages.map(m => <div key={m.id} className="world-message skyrim-font">{m.text}</div>)}
        </div>
      )}
      <Banner />

      <main className={`mobile-content ${onMap ? 'flush' : ''}`}>{children}</main>

      <footer className="mobile-bottom">
        <ShoutMeter compact />
        {!stats.zenMode && <StatBars compact />}
        <nav className="mobile-tabs" aria-label="Main">
          {TABS.map(t => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => `mobile-tab skyrim-font ${isActive ? 'active' : ''}`} onClick={() => playSound('UI_CLICK')}>
              <span className="tab-icon" aria-hidden="true">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </NavLink>
          ))}
        </nav>
      </footer>

      <LevelUpOverlay open={statsLoaded && stats.pendingLevelUps > 0 && ui.modalDepth === 0 && !systemOpen} />

      <Modal open={systemOpen} onClose={() => setSystemOpen(false)} title="SYSTEM" width={520} className="sheet">
        <div className="mobile-hero skyrim-font">
          <div>{stats.name}</div>
          <div className="muted">{stats.race.toUpperCase()} · LEVEL {stats.level} · {stats.completedQuestCount} QUESTS DONE</div>
        </div>
        <SystemSettings />
      </Modal>
    </div>
  );
};

export default MobileShell;
