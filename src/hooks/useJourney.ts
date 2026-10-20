import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatestRef } from './useLatestRef';
import { useAuth } from '../context/AuthContext';
import { compassStore } from '../context/compassStore';
import { fetchLocationHistory, getCurrentPosition } from '../services/locationService';
import type { UserLocation } from '../services/locationService';
import { bearing, compassOffset, relativeBearing } from '../game/geo';
import type { LatLng } from '../game/geo';

export type JourneyStatus = 'loading' | 'ready' | 'empty';

/** Loads the Journey Map data and feeds compass markers to the HUD as the map pans. */
export function useJourney(compassWidth: number) {
  const { currentUser } = useAuth();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<JourneyStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const raf = useRef<number | null>(null);
  const locationsRef = useLatestRef(locations);
  const lastKey = useRef('');

  const reload = useCallback(async () => {
    if (!currentUser) return;
    setStatus('loading');
    setError(null);
    try {
      const history = await fetchLocationHistory(currentUser.uid);
      setLocations(history);
      if (history.length > 0) {
        const last = history[history.length - 1];
        setCenter({ lat: last.lat, lng: last.lng });
        setStatus('ready');
        return;
      }
      const pos = await getCurrentPosition();
      if (pos) {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('ready');
      } else {
        setCenter({ lat: 64.9, lng: -18.5 }); // A frozen northern land, until we know where you are.
        setStatus('empty');
        setError('Location unavailable. Complete a quest with location enabled to chart your path.');
      }
    } catch (err) {
      console.error('Could not load journey', err);
      setStatus('empty');
      setError('The map could not be consulted.');
    }
  }, [currentUser]);

  useEffect(() => { void reload(); }, [reload]);

  // Clear markers when leaving the map.
  useEffect(() => () => { compassStore.set({ markers: [] }); }, []);

  /** Call on every map move; throttled to one update per animation frame. */
  const onMapMove = useCallback((c: LatLng) => {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const half = compassWidth / 2;
      const markers = locationsRef.current
        .map(loc => {
          const rel = relativeBearing(bearing(c, loc), compassStore.get().heading);
          return { id: loc.id ?? `${loc.lat},${loc.lng}`, offset: Math.round(compassOffset(rel, compassWidth)), icon: loc.label?.includes('Completed') ? '◆' : '✦' };
        })
        .filter(m => Math.abs(m.offset) <= half);
      const key = markers.map(m => `${m.id}:${m.offset}`).join('|');
      if (key !== lastKey.current) {
        lastKey.current = key;
        compassStore.set({ markers });
      }
    });
  }, [compassWidth, locationsRef]);

  return { locations, center, status, error, reload, onMapMove };
}
