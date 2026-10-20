import React from 'react';
import { useJourney } from '../hooks/useJourney';
import { useSound } from '../context/SoundContext';
import JourneyMap from '../components/Skyrim/JourneyMap';

const MobileMap: React.FC = () => {
  const { playSound } = useSound();
  const compassWidth = Math.min(300, (typeof window !== 'undefined' ? window.innerWidth : 360) - 150);
  const { locations, center, status, error, onMapMove } = useJourney(compassWidth);

  return (
    <div className="m-map">
      {center ? (
        <JourneyMap locations={locations} center={center} onMove={onMapMove} onMarkerClick={() => playSound('UI_CLICK')} zoom={status === 'empty' ? 5 : 14} />
      ) : (
        <div className="map-placeholder skyrim-font">CONSULTING THE MAP...</div>
      )}
      <div className="map-caption skyrim-font mobile">{error ?? (locations.length === 0 ? 'COMPLETE QUESTS TO CHART YOUR PATH' : 'TAP THE COMPASS TO FOLLOW THE HORIZON')}</div>
    </div>
  );
};

export default MobileMap;
