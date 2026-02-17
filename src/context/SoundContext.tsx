import React, { createContext, useContext, useEffect, useRef } from 'react';

type SoundType = 
  | 'UI_CLICK' 
  | 'UI_SWISH' 
  | 'MENU_OPEN' 
  | 'MENU_CLOSE' 
  | 'LEVEL_UP' 
  | 'SKILL_UP' 
  | 'QUEST_COMPLETE' 
  | 'SPELL_CAST' 
  | 'ITEM_USE';

interface SoundContextType {
  playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within a SoundProvider');
  return context;
};

// Map Sound Types to local file names in /public/sounds/
const FILE_MAP: Record<SoundType, string> = {
  UI_CLICK: 'click.mp3',
  UI_SWISH: 'click.mp3', 
  MENU_OPEN: 'click.mp3',
  MENU_CLOSE: 'click.mp3',
  LEVEL_UP: 'levelup.mp3',
  SKILL_UP: 'skillup.mp3',
  QUEST_COMPLETE: 'quest.mp3',
  SPELL_CAST: 'spell.mp3',
  ITEM_USE: 'item.mp3',
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioCtx = useRef<AudioContext | null>(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    const init = () => {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }
      hasInteracted.current = true;
    };
    window.addEventListener('mousedown', init, { once: false });
    window.addEventListener('keydown', init, { once: false });
    window.addEventListener('touchstart', init, { once: false });
    return () => {
      window.removeEventListener('mousedown', init);
      window.removeEventListener('keydown', init);
      window.removeEventListener('touchstart', init);
    };
  }, []);

  const playFallback = () => {
    if (!audioCtx.current || audioCtx.current.state === 'suspended') return;
    const ctx = audioCtx.current;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Ignore fallback errors
    }
  };

  const playSound = (type: SoundType) => {
    if (!hasInteracted.current) return;

    try {
      const fileName = FILE_MAP[type];
      const isProd = import.meta.env.PROD;
      const basePath = isProd ? '/moody-bitch/sounds/' : '/sounds/';
      const audio = new Audio(`${basePath}${fileName}`);
      
      let volume = 0.3;
      if (type === 'LEVEL_UP') volume = 0.8;
      if (type === 'QUEST_COMPLETE') volume = 0.6;
      if (type === 'UI_CLICK' || type === 'UI_SWISH') volume = 0.2;

      audio.volume = volume;
      audio.play().catch((err) => {
        console.warn("Audio play blocked or failed:", err);
        playFallback();
      });
    } catch (e) {
      playFallback();
    }
  };

  return (
    <SoundContext.Provider value={{ playSound }}>
      {children}
    </SoundContext.Provider>
  );
};
