import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLatestRef } from '../hooks/useLatestRef';

export type SoundType =
  | 'UI_CLICK' | 'UI_SWISH' | 'MENU_OPEN' | 'MENU_CLOSE'
  | 'LEVEL_UP' | 'SKILL_UP' | 'QUEST_COMPLETE' | 'SPELL_CAST' | 'ITEM_USE';

interface SoundContextType {
  playSound: (type: SoundType) => void;
  volume: number;
  muted: boolean;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within a SoundProvider');
  return context;
};

// Sound files live in /public/sounds/ and are served relative to the app base URL.
const FILE_MAP: Record<SoundType, { file: string; gain: number }> = {
  UI_CLICK: { file: 'click.mp3', gain: 0.2 },
  UI_SWISH: { file: 'click.mp3', gain: 0.2 },
  MENU_OPEN: { file: 'click.mp3', gain: 0.3 },
  MENU_CLOSE: { file: 'click.mp3', gain: 0.3 },
  LEVEL_UP: { file: 'levelup.mp3', gain: 0.8 },
  SKILL_UP: { file: 'skillup.mp3', gain: 0.4 },
  QUEST_COMPLETE: { file: 'quest.mp3', gain: 0.6 },
  SPELL_CAST: { file: 'spell.mp3', gain: 0.35 },
  ITEM_USE: { file: 'item.mp3', gain: 0.35 },
};

const STORAGE_KEY = 'swm:sound';

function readPrefs(): { volume: number; muted: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { volume: Math.min(1, Math.max(0, Number(p.volume) || 0)), muted: p.muted === true };
    }
  } catch { /* storage unavailable */ }
  return { volume: 0.8, muted: false };
}

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState(readPrefs);
  const prefsRef = useLatestRef(prefs);
  const hasInteracted = useRef(false);
  const cache = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  useEffect(() => {
    // Browsers only allow audio after a user gesture.
    const unlock = () => { hasInteracted.current = true; };
    const opts = { passive: true } as AddEventListenerOptions;
    window.addEventListener('pointerdown', unlock, opts);
    window.addEventListener('keydown', unlock, opts);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const playSound = useCallback((type: SoundType) => {
    const { muted, volume } = prefsRef.current;
    if (muted || volume <= 0 || !hasInteracted.current) return;
    if (typeof Audio === 'undefined') return;
    try {
      const { file, gain } = FILE_MAP[type];
      const src = `${import.meta.env.BASE_URL}sounds/${file}`;
      let base = cache.current.get(src);
      if (!base) {
        base = new Audio(src);
        base.preload = 'auto';
        cache.current.set(src, base);
      }
      // Clone so rapid clicks overlap instead of cutting each other off.
      const a = base.cloneNode(true) as HTMLAudioElement;
      a.volume = Math.min(1, gain * volume);
      a.play().catch(() => { /* autoplay policy or missing file; stay silent */ });
    } catch { /* never let audio break the game */ }
  }, [prefsRef]);

  const value = useMemo<SoundContextType>(() => ({
    playSound,
    volume: prefs.volume,
    muted: prefs.muted,
    setVolume: (v: number) => setPrefs(p => ({ ...p, volume: Math.min(1, Math.max(0, v)) })),
    setMuted: (m: boolean) => setPrefs(p => ({ ...p, muted: m })),
  }), [playSound, prefs.volume, prefs.muted]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};
