import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { useAuth } from '../../context/AuthContext';

interface SkyrimMenuProps {
  hideButton?: boolean;
}

/** The four-way character menu: Skills up, Map down, Magic left, Items right, Today at the centre. */
const SkyrimMenu: React.FC<SkyrimMenuProps> = ({ hideButton = false }) => {
  const { ui, setUI, stats } = useGame();
  const { playSound } = useSound();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try { await signOut(); navigate('/signin'); } catch (error) { console.error('Failed to log out', error); }
  };

  const go = () => { setUI({ isMenuOpen: false }); playSound('UI_CLICK'); };
  const hasLevelUp = stats.pendingLevelUps > 0;

  if (!ui.isMenuOpen) {
    if (hideButton) return null;
    return (
      <button onClick={() => setUI({ isMenuOpen: true, isPauseMenuOpen: false })} className={`hud-button right skyrim-font ${hasLevelUp ? 'glow' : ''} ${location.pathname === '/skills' ? 'lowered' : ''}`}>
        {hasLevelUp ? 'LEVEL UP!' : 'CHARACTER [TAB]'}
      </button>
    );
  }

  return (
    <div className="skyrim-menu-overlay solid" onMouseDown={e => { if (e.target === e.currentTarget) setUI({ isMenuOpen: false }); }} role="dialog" aria-modal="true" aria-label="Character menu">
      <button onClick={() => setUI({ isMenuOpen: false, isPauseMenuOpen: true })} className="hud-button left lowered skyrim-font">SYSTEM</button>
      <button onClick={() => void handleLogout()} className="hud-button right lowered danger skyrim-font">QUIT REALM</button>

      <div className="character-menu-diamond">
        <Link to="/skills" className="diamond-item item-up" onClick={go}>
          <div className={`diamond-label skyrim-font ${hasLevelUp ? 'gold' : ''}`}>{hasLevelUp ? 'LEVEL UP' : 'SKILLS'}</div>
          <div className={`diamond-line-up ${hasLevelUp ? 'gold' : ''}`} />
        </Link>
        <Link to="/dashboard" className="diamond-item item-down" onClick={go}>
          <div className="diamond-line-down" />
          <div className="diamond-label skyrim-font">MAP</div>
        </Link>
        <Link to="/magic" className="diamond-item item-left" onClick={go}>
          <div className="diamond-label skyrim-font">MAGIC</div>
          <div className="diamond-line-left" />
        </Link>
        <Link to="/inventory" className="diamond-item item-right" onClick={go}>
          <div className="diamond-label skyrim-font">ITEMS</div>
          <div className="diamond-line-right" />
        </Link>
        <Link to="/today" className="diamond-center skyrim-font" onClick={go} aria-label="Today">
          <div className="diamond-dot" />
          <span>TODAY</span>
        </Link>
      </div>

      <div className="menu-hint skyrim-font">[ CLICK A DIRECTION · TAB TO CLOSE ]</div>
    </div>
  );
};

export default SkyrimMenu;
