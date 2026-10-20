import { useSyncExternalStore } from 'react';

export interface CompassMarker { id: string; offset: number; icon: string }
export interface CompassState { heading: number; markers: CompassMarker[] }

/**
 * The compass updates on every map-pan frame. Keeping it out of the game
 * context means only the Compass component re-renders, not every screen.
 */
let state: CompassState = { heading: 0, markers: [] };
const listeners = new Set<() => void>();

export const compassStore = {
  get: () => state,
  set(partial: Partial<CompassState>) {
    state = { ...state, ...partial };
    listeners.forEach(l => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};

export const useCompass = () => useSyncExternalStore(compassStore.subscribe, compassStore.get, compassStore.get);
