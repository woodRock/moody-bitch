import { describe, it, expect } from 'vitest';
import { CONSTELLATIONS } from './constellations';

describe('CONSTELLATIONS data', () => {
  it('should be an array of constellations', () => {
    expect(Array.isArray(CONSTELLATIONS)).toBe(true);
    expect(CONSTELLATIONS.length).toBeGreaterThan(0);
  });

  CONSTELLATIONS.forEach((constellation) => {
    describe(`Constellation: ${constellation.name}`, () => {
      it('should have required properties', () => {
        expect(constellation).toHaveProperty('name');
        expect(constellation).toHaveProperty('skillKey');
        expect(constellation).toHaveProperty('description');
        expect(constellation).toHaveProperty('perks');
        expect(constellation).toHaveProperty('lines');
        expect(constellation).toHaveProperty('spectralPaths');
      });

      it('should have valid perks', () => {
        expect(constellation.perks.length).toBeGreaterThan(0);
        constellation.perks.forEach((perk) => {
          expect(perk).toHaveProperty('id');
          expect(perk).toHaveProperty('name');
          expect(perk).toHaveProperty('x');
          expect(perk).toHaveProperty('y');
          expect(perk).toHaveProperty('description');
        });
      });

      it('should have valid line indices', () => {
        constellation.lines.forEach(([start, end]) => {
          expect(start).toBeGreaterThanOrEqual(0);
          expect(start).toBeLessThan(constellation.perks.length);
          expect(end).toBeGreaterThanOrEqual(0);
          expect(end).toBeLessThan(constellation.perks.length);
        });
      });
    });
  });
});
