import { describe, it, expect } from 'vitest';
import { bearing, relativeBearing, compassOffset, distanceMeters } from './geo';

describe('geo', () => {
  it('bearing due north is 0 and due east is 90', () => {
    const o = { lat: 0, lng: 0 };
    expect(bearing(o, { lat: 1, lng: 0 })).toBeCloseTo(0);
    expect(bearing(o, { lat: 0, lng: 1 })).toBeCloseTo(90);
    expect(bearing(o, { lat: -1, lng: 0 })).toBeCloseTo(180);
    expect(bearing(o, { lat: 0, lng: -1 })).toBeCloseTo(270);
  });

  it('relative bearing wraps to [-180, 180)', () => {
    expect(relativeBearing(10, 350)).toBe(20);
    expect(relativeBearing(350, 10)).toBe(-20);
    expect(relativeBearing(90, 0)).toBe(90);
    expect(relativeBearing(180, 0)).toBe(-180);
  });

  it('compass offset maps the field of view across the strip', () => {
    expect(compassOffset(0, 400)).toBe(0);
    expect(compassOffset(90, 400)).toBe(200);
    expect(compassOffset(-45, 400)).toBe(-100);
  });

  it('distance between Whiterun-ish points', () => {
    const d = distanceMeters({ lat: 51.5, lng: 0 }, { lat: 51.5, lng: 0.01 });
    expect(d).toBeGreaterThan(600);
    expect(d).toBeLessThan(800);
  });
});
