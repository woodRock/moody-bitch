import React from 'react';
import { compassOffset, relativeBearing } from '../../game/geo';

interface Marker { id: string; offset: number; icon: string }

interface CompassProps {
  heading: number;
  markers?: Marker[];
  width?: number;
  onClick?: () => void;
  title?: string;
}

const CARDINALS: { deg: number; label: string; major: boolean }[] = [
  { deg: 0, label: 'N', major: true }, { deg: 45, label: 'NE', major: false },
  { deg: 90, label: 'E', major: true }, { deg: 135, label: 'SE', major: false },
  { deg: 180, label: 'S', major: true }, { deg: 225, label: 'SW', major: false },
  { deg: 270, label: 'W', major: true }, { deg: 315, label: 'NW', major: false },
];
const TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

/**
 * Skyrim's horizon compass. North sits at the centre when heading is 0 and
 * the strip slides as the heading changes. Markers are pixel offsets from
 * the centre, computed by the caller from real bearings.
 */
const Compass: React.FC<CompassProps> = ({ heading, markers = [], width = 400, onClick, title }) => {
  const half = width / 2;
  const visible = (x: number) => Math.abs(x) <= half + 24;

  return (
    <div
      className={`compass-container ${onClick ? 'interactive' : ''}`}
      style={{ width }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      title={title}
      aria-label={`Compass heading ${Math.round(heading)} degrees`}
    >
      {TICKS.map(deg => {
        const x = compassOffset(relativeBearing(deg, heading), width);
        if (!visible(x) || deg % 45 === 0) return null;
        return <div key={`t${deg}`} className="compass-tick" style={{ transform: `translateX(${x}px)` }} />;
      })}
      {CARDINALS.map(c => {
        const x = compassOffset(relativeBearing(c.deg, heading), width);
        if (!visible(x)) return null;
        return (
          <div key={c.label} className={`compass-mark ${c.major ? 'major' : 'minor'}`} style={{ transform: `translateX(${x}px)` }}>
            {c.label}
          </div>
        );
      })}
      {markers.filter(m => visible(m.offset)).map(m => (
        <div key={m.id} className="compass-marker" style={{ transform: `translateX(${m.offset}px)` }}>{m.icon}</div>
      ))}
      <div className="compass-needle" />
    </div>
  );
};

export default Compass;
