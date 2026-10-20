import React, { useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTrackpadSwipe } from '../../hooks/useTrackpadSwipe';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { useAuth } from '../../context/AuthContext';

interface SkyrimMenuProps {
  disabledGestures?: boolean;
  hideButton?: boolean;
}

/** The four-way character menu: Skills up, Map down, Magic left, Items right. */
const SkyrimMenu: React.FC<SkyrimMenuProps> = ({ disabledGestures = false, hideButton = false }) => {
  const { ui, setUI, stats } = useGame();
  const { playSound } = useSound();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const springX = useSpring(dragX, { stiffness: 300, damping: 30 });
  const springY = useSpring(dragY, { stiffness: 300, damping: 30 });

  const handleLogout = async () => {
    try { await signOut(); navigate('/signin'); } catch (error) { console.error('Failed to log out', error); }
  };

  const go = useCallback((path: string) => { navigate(path); setUI({ isMenuOpen: false }); }, [navigate, setUI]);

  const handleGesture = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (ui.isMenuOpen) {
      if (direction === 'UP') go('/skills');
      else if (direction === 'DOWN') go('/dashboard');
      else if (direction === 'LEFT') go('/magic');
      else if (direction === 'RIGHT') go('/inventory');
    } else {
      const path = location.pathname;
      if ((path === '/skills' && direction === 'DOWN') || (path === '/dashboard' && direction === 'UP') ||
          (path === '/magic' && direction === 'RIGHT') || (path === '/inventory' && direction === 'LEFT')) {
        setUI({ isMenuOpen: true });
      }
    }
    dragX.set(0);
    dragY.set(0);
  }, [ui.isMenuOpen, go, location.pathname, dragX, dragY, setUI]);

  const handleProgress = useCallback((offset: { x: number; y: number }) => {
    dragX.set(-offset.x * 0.5);
    dragY.set(-offset.y * 0.5);
  }, [dragX, dragY]);

  useTrackpadSwipe({
    onSwipe: handleGesture,
    onProgress: handleProgress,
    threshold: 120,
    disabled: (disabledGestures && !ui.isMenuOpen) || ui.isPauseMenuOpen || ui.modalDepth > 0,
    preventX: true,
  });

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

      <motion.div className="character-menu-diamond" style={{ x: springX, y: springY }}>
        <Link to="/skills" className="diamond-item item-up" onClick={() => { setUI({ isMenuOpen: false }); playSound('UI_CLICK'); }}>
          <div className={`diamond-label skyrim-font ${hasLevelUp ? 'gold' : ''}`}>{hasLevelUp ? 'LEVEL UP' : 'SKILLS'}</div>
          <div className={`diamond-line-up ${hasLevelUp ? 'gold' : ''}`} />
        </Link>
        <Link to="/dashboard" className="diamond-item item-down" onClick={() => { setUI({ isMenuOpen: false }); playSound('UI_CLICK'); }}>
          <div className="diamond-line-down" />
          <div className="diamond-label skyrim-font">MAP</div>
        </Link>
        <Link to="/magic" className="diamond-item item-left" onClick={() => { setUI({ isMenuOpen: false }); playSound('UI_CLICK'); }}>
          <div className="diamond-label skyrim-font">MAGIC</div>
          <div className="diamond-line-left" />
        </Link>
        <Link to="/inventory" className="diamond-item item-right" onClick={() => { setUI({ isMenuOpen: false }); playSound('UI_CLICK'); }}>
          <div className="diamond-label skyrim-font">ITEMS</div>
          <div className="diamond-line-right" />
        </Link>
        <div className="diamond-center"><div className="diamond-dot" /></div>
      </motion.div>

      <div className="menu-hint skyrim-font">[ SCROLL OR CLICK TO NAVIGATE · TAB TO CLOSE ]</div>
    </div>
  );
};

export default SkyrimMenu;
