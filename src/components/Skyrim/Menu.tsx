import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useTwoFingerSwipe } from '../../hooks/useTwoFingerSwipe';
import '../../styles/Skyrim.css';

interface SkyrimMenuProps {
  onOpenPause?: () => void;
}

const SkyrimMenu: React.FC<SkyrimMenuProps> = ({ onOpenPause }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleGesture = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (isOpen) {
      // NAVIGATING FROM MENU
      if (direction === 'UP') { navigate('/skills'); setIsOpen(false); }
      if (direction === 'DOWN') { navigate('/dashboard'); setIsOpen(false); }
      if (direction === 'LEFT') { navigate('/magic'); setIsOpen(false); }
      if (direction === 'RIGHT') { navigate('/inventory'); setIsOpen(false); }
    } else {
      // RETURNING TO MENU
      const path = location.pathname;
      if (path === '/skills' && direction === 'DOWN') setIsOpen(true);
      if (path === '/dashboard' && direction === 'UP') setIsOpen(true);
      if (path === '/magic' && direction === 'RIGHT') setIsOpen(true);
      if (path === '/inventory' && direction === 'LEFT') setIsOpen(true);
    }
  }, [isOpen, navigate, location.pathname]);

  useTwoFingerSwipe({ onSwipe: handleGesture });

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="skyrim-font"
        style={{
          position: 'fixed',
          top: '4.5rem',
          left: '2rem',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--skyrim-gold-dim)',
          color: '#aaa',
          fontSize: '0.8rem',
          padding: '0.4rem 0.8rem',
          cursor: 'pointer',
          zIndex: 200,
          textShadow: '1px 1px 0 #000'
        }}
      >
        MENU [TAB]
      </button>
    );
  }

  return (
    <div className="skyrim-menu-overlay" onClick={() => setIsOpen(false)} style={{ background: 'rgba(0,0,0,0.9)' }}>
      {/* Top Left Pause Button */}
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          setIsOpen(false);
          if (onOpenPause) onOpenPause(); 
        }}
        className="skyrim-font"
        style={{
          position: 'fixed',
          top: '2rem',
          left: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--skyrim-gold-dim)',
          color: '#fff',
          padding: '0.5rem 1.5rem',
          cursor: 'pointer',
          zIndex: 1100,
          fontSize: '0.9rem',
          letterSpacing: '2px'
        }}
      >
        PAUSE
      </button>

      {/* Top Right Quit Icon */}
      <button 
        onClick={(e) => { e.stopPropagation(); handleLogout(); }}
        className="skyrim-font"
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          background: 'rgba(169, 41, 41, 0.2)',
          border: '1px solid #a92929',
          color: '#a92929',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          zIndex: 1100,
          fontSize: '0.8rem'
        }}
      >
        QUIT REALM [ESC]
      </button>

      <div className="character-menu-diamond" onClick={e => e.stopPropagation()}>
        
        {/* TOP: SKILLS */}
        <Link to="/skills" className="diamond-item item-up" onClick={() => setIsOpen(false)}>
          <div className="diamond-label skyrim-font">SKILLS</div>
          <div className="diamond-line-up"></div>
        </Link>

        {/* BOTTOM: MAP */}
        <Link to="/dashboard" className="diamond-item item-down" onClick={() => setIsOpen(false)}>
          <div className="diamond-line-down"></div>
          <div className="diamond-label skyrim-font">MAP</div>
        </Link>

        {/* LEFT: MAGIC */}
        <Link to="/magic" className="diamond-item item-left" onClick={() => setIsOpen(false)}>
          <div className="diamond-label skyrim-font">MAGIC</div>
          <div className="diamond-line-left"></div>
        </Link>

        {/* RIGHT: ITEMS */}
        <Link to="/inventory" className="diamond-item item-right" onClick={() => setIsOpen(false)}>
          <div className="diamond-line-right"></div>
          <div className="diamond-label skyrim-font">ITEMS</div>
        </Link>

        {/* CENTER: Now empty for a cleaner look */}
        <div className="diamond-center">
           <div style={{ width: '4px', height: '4px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #fff' }}></div>
        </div>

      </div>
      
      <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', color: '#777' }} className="skyrim-font">
        [ TWO-FINGER SLIDE TO NAVIGATE ]
      </div>
    </div>
  );
};

export default SkyrimMenu;
