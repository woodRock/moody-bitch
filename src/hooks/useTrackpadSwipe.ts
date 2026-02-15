import { useEffect, useRef } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface TrackpadOptions {
  onSwipe: (direction: Direction) => void;
  threshold?: number;
  cooldown?: number;
}

export const useTrackpadSwipe = ({ onSwipe, threshold = 30, cooldown = 800 }: TrackpadOptions) => {
  const lastSwipeTime = useRef<number>(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastSwipeTime.current < cooldown) return;

      const { deltaX, deltaY } = e;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical Scroll
        if (Math.abs(deltaY) > threshold) {
          onSwipe(deltaY > 0 ? 'DOWN' : 'UP');
          lastSwipeTime.current = now;
        }
      } else {
        // Horizontal Scroll
        if (Math.abs(deltaX) > threshold) {
          onSwipe(deltaX > 0 ? 'RIGHT' : 'LEFT');
          lastSwipeTime.current = now;
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [onSwipe, threshold, cooldown]);
};
