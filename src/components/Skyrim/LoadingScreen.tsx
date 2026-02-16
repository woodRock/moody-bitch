import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/Skyrim.css';

const LORE_TIPS = [
  "Restoration is a perfectly valid school of magic. Don't let anyone tell you otherwise.",
  "Taking a brisk walk in the physical realm increases your Stamina XP significantly.",
  "The Amulet of Akatosh grants a global XP bonus. Keep it equipped for faster leveling.",
  "Reading your past chronicles in the Journal can help reveal patterns in your spirit.",
  "Even the Dragonborn needs a consistent bedtime to keep their Magicka high.",
  "Transmuting a negative thought into a lesson is the first step toward mastery of Alteration.",
  "A Sweetroll a day keeps the Thalmor away. Or at least makes the afternoon better.",
];

const LoadingScreen: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [tip, setTip] = useState(LORE_TIPS[0]);

  useEffect(() => {
    if (isLoading) {
      setTip(LORE_TIPS[Math.floor(Math.random() * LORE_TIPS.length)]);
    }
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          transition={{ duration: 1 }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: '#000', zIndex: 10000, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
          }}
        >
          {/* Rotating 3D Placeholder (A Cube) */}
          <div className="loading-scene">
            <motion.div 
              className="loading-cube"
              animate={{ rotateY: 360, rotateX: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <div className="face front">✨</div>
              <div className="face back">💎</div>
              <div className="face left">📜</div>
              <div className="face right">🍷</div>
              <div className="face top">⚔️</div>
              <div className="face bottom">🛡️</div>
            </motion.div>
          </div>

          <div style={{ maxWidth: '600px', textAlign: 'right', marginTop: '4rem', padding: '2rem' }}>
            <h2 className="skyrim-font" style={{ color: 'var(--skyrim-gold-bright)', fontSize: '1.5rem', marginBottom: '1rem' }}>DID YOU KNOW?</h2>
            <p className="skyrim-serif" style={{ color: '#fff', fontSize: '1.4rem', fontStyle: 'italic', lineHeight: '1.6' }}>
              "{tip}"
            </p>
          </div>

          {/* Loading Bar at bottom right */}
          <div style={{ position: 'fixed', bottom: '4rem', right: '4rem', width: '300px' }}>
            <div className="skyrim-font" style={{ color: '#555', fontSize: '0.8rem', textAlign: 'right', marginBottom: '0.5rem' }}>LOADING REALM...</div>
            <div style={{ height: '2px', background: '#222', width: '100%' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: "easeInOut" }}
                style={{ height: '100%', background: 'var(--skyrim-gold-dim)' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
