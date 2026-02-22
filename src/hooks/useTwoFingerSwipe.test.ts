import { renderHook } from '@testing-library/react';
import { useTwoFingerSwipe } from './useTwoFingerSwipe';
import { vi, describe, it, expect } from 'vitest';

describe('useTwoFingerSwipe', () => {
  it('should call onSwipe with RIGHT when swiping right with two fingers', () => {
    const onSwipe = vi.fn();
    renderHook(() => useTwoFingerSwipe({ onSwipe }));

    // Simulate touchstart
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { clientX: 10, clientY: 10 } as Touch,
        { clientX: 20, clientY: 10 } as Touch,
      ] as any,
    });
    window.dispatchEvent(touchStartEvent);

    // Simulate touchend
    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [
        { clientX: 100, clientY: 10 } as Touch,
        { clientX: 110, clientY: 10 } as Touch,
      ] as any,
    });
    window.dispatchEvent(touchEndEvent);

    expect(onSwipe).toHaveBeenCalledWith('RIGHT');
  });

  it('should call onSwipe with UP when swiping up with two fingers', () => {
    const onSwipe = vi.fn();
    renderHook(() => useTwoFingerSwipe({ onSwipe }));

    // Simulate touchstart
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { clientX: 10, clientY: 100 } as Touch,
        { clientX: 20, clientY: 100 } as Touch,
      ] as any,
    });
    window.dispatchEvent(touchStartEvent);

    // Simulate touchend
    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [
        { clientX: 10, clientY: 10 } as Touch,
        { clientX: 20, clientY: 10 } as Touch,
      ] as any,
    });
    window.dispatchEvent(touchEndEvent);

    expect(onSwipe).toHaveBeenCalledWith('UP');
  });

  it('should not call onSwipe if movement is below threshold', () => {
    const onSwipe = vi.fn();
    renderHook(() => useTwoFingerSwipe({ onSwipe, threshold: 50 }));

    // Simulate touchstart
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { clientX: 10, clientY: 10 } as Touch,
        { clientX: 20, clientY: 10 } as Touch,
      ] as any,
    });
    window.dispatchEvent(touchStartEvent);

    // Simulate touchend (only 20px movement)
    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [
        { clientX: 30, clientY: 10 } as Touch,
        { clientX: 40, clientY: 10 } as Touch,
      ] as any,
    });
    window.dispatchEvent(touchEndEvent);

    expect(onSwipe).not.toHaveBeenCalled();
  });
});
