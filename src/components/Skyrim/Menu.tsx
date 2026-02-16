import React, { useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useTrackpadSwipe } from '../../hooks/useTrackpadSwipe';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import '../../styles/Skyrim.css';

interface SkyrimMenuProps {
  disabledGestures?: boolean;
  hideButton?: boolean;
}

const SkyrimMenu: React.FC<SkyrimMenuProps> = ({ disabledGestures = false, hideButton = false }) => {
  const { ui, setUI, stats } = useGame();
  const { playSound } = useSound();
  const navigate = useNavigate();
  const location = useLocation();

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const springX = useSpring(dragX, { stiffness: 300, damping: 30 });
  const springY = useSpring(dragY, { stiffness: 300, damping: 30 });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleGesture = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (ui.isMenuOpen) {
      if (direction === 'UP') { navigate('/skills'); setUI({ isMenuOpen: false }); }
      else if (direction === 'DOWN') { navigate('/dashboard'); setUI({ isMenuOpen: false }); }
      else if (direction === 'LEFT') { navigate('/magic'); setUI({ isMenuOpen: false }); }
      else if (direction === 'RIGHT') { navigate('/inventory'); setUI({ isMenuOpen: false }); }
    } else {
      const path = location.pathname;
      if (path === '/skills' && direction === 'DOWN') setUI({ isMenuOpen: true });
      else if (path === '/dashboard' && direction === 'UP') setUI({ isMenuOpen: true });
      else if (path === '/magic' && direction === 'RIGHT') setUI({ isMenuOpen: true });
      else if (path === '/inventory' && direction === 'LEFT') setUI({ isMenuOpen: true });
    }
    dragX.set(0);
    dragY.set(0);
  }, [ui.isMenuOpen, navigate, location.pathname, dragX, dragY, setUI]);

  const handleProgress = useCallback((offset: { x: number, y: number }) => {
    dragX.set(-offset.x * 0.5);
    dragY.set(-offset.y * 0.5);
  }, [dragX, dragY]);

  useTrackpadSwipe({ 
    onSwipe: handleGesture,
    onProgress: handleProgress,
    threshold: 120,
    disabled: disabledGestures && !ui.isMenuOpen,
    preventX: true 
  });

  if (!ui.isMenuOpen) {
    if (hideButton) return null;
    
    return (
      <button 
        onClick={() => setUI({ isMenuOpen: true, isPauseMenuOpen: false })}
        className="skyrim-font"
        style={{
          position: 'fixed', top: '1.5rem', right: '2rem',
          background: 'rgba(0,0,0,0.5)', border: '1px solid var(--skyrim-gold-dim)',
          color: stats.pendingLevelUps > 0 ? 'var(--skyrim-gold-bright)' : '#aaa', 
          fontSize: '0.8rem', padding: '0.4rem 0.8rem',
          cursor: 'pointer', zIndex: 200, textShadow: '1px 1px 0 #000',
          boxShadow: stats.pendingLevelUps > 0 ? '0 0 15px rgba(230, 194, 120, 0.3)' : 'none'
        }}
      >
        {stats.pendingLevelUps > 0 ? 'LEVEL UP!' : 'CHARACTER [TAB]'}
      </button>
    );
  }

  return (
    <div className="skyrim-menu-overlay" onClick={() => setUI({ isMenuOpen: false })} style={{ background: 'rgba(0,0,0,0.9)' }}>
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          setUI({ isMenuOpen: false, isPauseMenuOpen: true });
        }}
        className="skyrim-font"
        style={{
          position: 'fixed', top: '2rem', left: '2rem',
          background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--skyrim-gold-dim)',
          color: '#fff', padding: '0.5rem 1.5rem', cursor: 'pointer', zIndex: 1100,
          fontSize: '0.9rem', letterSpacing: '2px'
        }}
      >
        PAUSE
      </button>

      <button 
        onClick={(e) => { e.stopPropagation(); handleLogout(); }}
        className="skyrim-font"
        style={{
          position: 'fixed', top: '2rem', right: '2rem',
          background: 'rgba(169, 41, 41, 0.2)', border: '1px solid #a92929',
          color: '#a92929', padding: '0.5rem 1rem', cursor: 'pointer', zIndex: 1100, fontSize: '0.8rem'
        }}
      >
        QUIT REALM [ESC]
      </button>

      <motion.div 
        className="character-menu-diamond" 
        onClick={e => e.stopPropagation()}
        style={{ x: springX, y: springY }}
      >
        <Link to="/skills" className="diamond-item item-up" onClick={() => { setUI({ isMenuOpen: false }); playSound('UI_CLICK'); }}>
          <div className="diamond-label skyrim-font" style={{ color: stats.pendingLevelUps > 0 ? 'var(--skyrim-gold-bright)' : 'inherit' }}>
            {stats.pendingLevelUps > 0 ? 'LEVEL UP' : 'SKILLS'}
          </div>
          <div className="diamond-line-up" style={{ background: stats.pendingLevelUps > 0 ? 'var(--skyrim-gold-bright)' : 'inherit' }}></div>
        </Link>

        <Link to="/dashboard" className="diamond-item item-down" onClick={() => { setUI({ isMenuOpen: false }); playSound('UI_CLICK'); }}>
          <div className="diamond-line-down"></div>
          <div className="diamond-label skyrim-font">MAP</div>
        </Link>

        <Link to="/magic" className="diamond-item item-left" onClick={() => { setUI({ isMenuOpen: false }); playSound('UI_CLICK'); }}>
          <div className="diamond-label skyrim-font">MAGIC</div>
          <div className="diamond-line-left"></div>
        </Link>

        <Link to="/inventory" className="diamond-item item-right" onClick={() => { setUI({ isMenuOpen: false }); playSound('UI_CLICK'); }}>
          <div className="diamond-line-right"></div>
          <div className="diamond-label skyrim-font">ITEMS</div>
        </Link>

        <div className="diamond-center">
           <div style={{ width: '4px', height: '4px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #fff' }}></div>
        </div>
      </motion.div>
      
      <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', color: '#777' }} className="skyrim-font">
        [ SCROLL TO NAVIGATE ]
      </div>
    </div>
  );
};

export default SkyrimMenu;
