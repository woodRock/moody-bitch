import { useEffect, useRef } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface TrackpadOptions {
  onSwipe: (direction: Direction) => void;
  onProgress?: (offset: { x: number; y: number }) => void;
  threshold?: number;
  cooldown?: number;
  disabled?: boolean;
  preventX?: boolean;
  preventY?: boolean;
}

export const useTrackpadSwipe = ({ 
  onSwipe, 
  onProgress, 
  threshold = 120, 
  cooldown = 500, 
  disabled = false,
  preventX = true,
  preventY = false
}: TrackpadOptions) => {
  const lastSwipeTime = useRef<number>(0);
  const accumulated = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (disabled) return;

    const handleWheel = (e: WheelEvent) => {
      const { deltaX, deltaY } = e;
      
      // Stop browser from using the swipe for Back/Forward navigation
      if (preventX && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
        e.preventDefault();
      }
      if (preventY && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
        e.preventDefault();
      }

      const now = Date.now();
      if (now - lastSwipeTime.current < cooldown) return;

      accumulated.current.x += deltaX;
      accumulated.current.y += deltaY;

      if (onProgress) {
        onProgress({ x: accumulated.current.x, y: accumulated.current.y });
      }

      const absX = Math.abs(accumulated.current.x);
      const absY = Math.abs(accumulated.current.y);

      if (absX > threshold || absY > threshold) {
        if (absX > absY) {
          // Dominant Horizontal
          onSwipe(accumulated.current.x > 0 ? 'RIGHT' : 'LEFT');
        } else {
          // Dominant Vertical
          onSwipe(accumulated.current.y > 0 ? 'DOWN' : 'UP');
        }
        lastSwipeTime.current = now;
        resetAccumulated();
      }

      // Reset accumulated after a short pause in movement
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        resetAccumulated();
      }, 150);
    };

    const resetAccumulated = () => {
      accumulated.current = { x: 0, y: 0 };
      if (onProgress) onProgress({ x: 0, y: 0 });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onSwipe, onProgress, threshold, cooldown, disabled, preventX, preventY]);
};
