import React from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import { useJourney } from '../hooks/useJourney';
import JourneyMap from '../components/Skyrim/JourneyMap';

/** Desktop "MAP" screen: the Journey Map with the HUD compass tracking your path. */
const Dashboard: React.FC = () => {
  const { setUI } = useGame();
  const { playSound } = useSound();
  const { locations, center, status, error, onMapMove } = useJourney(400);

  return (
    <div className="map-screen">
      <button
        onClick={() => { setUI({ isMenuOpen: true }); playSound('UI_CLICK'); }}
        className="nav-arrow top"
        aria-label="Open character menu"
      >
        &uarr;
      </button>

      <div className="map-wrapper">
        {center ? (
          <JourneyMap locations={locations} center={center} onMove={onMapMove} onMarkerClick={() => playSound('UI_CLICK')} zoom={status === 'empty' ? 5 : 13} />
        ) : (
          <div className="map-placeholder skyrim-font">{status === 'loading' ? 'CONSULTING THE MAP...' : 'THE MAP IS BLANK'}</div>
        )}
      </div>

      <div className="map-caption skyrim-font">
        {error ?? (locations.length === 0 ? 'COMPLETE QUESTS AND SCRIBE LOGS TO CHART YOUR PATH' : 'PAN THE MAP TO DISCOVER YOUR PATH')}
      </div>
    </div>
  );
};

export default Dashboard;
