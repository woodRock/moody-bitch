import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import '../styles/Dashboard.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { fetchLocationHistory } from '../services/locationService';
import type { UserLocation } from '../services/locationService';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const MapController = ({ onMove }: { onMove: (center: L.LatLng) => void }) => {
  useMapEvents({
    move: (e) => onMove(e.target.getCenter()),
  });
  return null;
};

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { setUI, ui } = useGame();
  const { playSound } = useSound();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadHistory();
      const handleOrientation = (e: any) => {
        const heading = e.webkitCompassHeading || (360 - (e.alpha || 0));
        setUI({ heading });
      };
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [currentUser]);

  const loadHistory = async () => {
    if (!currentUser) return;
    const history = await fetchLocationHistory(currentUser.uid);
    setLocations(history);
    if (history.length > 0) {
      const last = history[history.length - 1];
      setMapCenter([last.lat, last.lng]);
      setHasLocation(true);
    } else {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setHasLocation(true);
      });
    }
  };

  const updateCompassMarkers = useCallback((center: L.LatLng) => {
    const newMarkers = locations.map(loc => {
      const y = Math.sin(loc.lng - center.lng) * Math.cos(loc.lat);
      const x = Math.cos(center.lat) * Math.sin(loc.lat) -
                Math.sin(center.lat) * Math.cos(loc.lat) * Math.cos(loc.lng - center.lng);
      let bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      let relativeBearing = (bearing - ui.heading + 540) % 360 - 180;
      
      return {
        id: loc.id || Math.random().toString(),
        offset: relativeBearing * (400 / 180),
        icon: loc.label?.includes('Quest') ? '📍' : '📜'
      };
    }).filter(m => Math.abs(m.offset) < 200);

    setUI({ compassMarkers: newMarkers });
  }, [locations, ui.heading, setUI]);

  const pathPositions = locations.map(loc => [loc.lat, loc.lng] as [number, number]);

  return (
    <div className="dashboard-container" style={{ padding: 0, overflow: 'hidden' }}>
      <style>{`
        .skyrim-font[style*="top: 1.5rem"], .skyrim-font[style*="top: 2rem"] { top: 1.5rem !important; }
      `}</style>

      {/* BACK TO MENU ARROW (UP) */}
      <button 
        onClick={() => { setUI({ isMenuOpen: true }); playSound('UI_CLICK'); }}
        className="skyrim-font"
        style={{
          position: 'fixed',
          top: '4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'none',
          border: 'none',
          color: 'var(--skyrim-gold-bright)',
          fontSize: '3rem',
          cursor: 'pointer',
          zIndex: 100,
          opacity: 0.6
        }}
      >
        &uarr;
      </button>

      <div className="map-wrapper" style={{ width: '100vw', height: '100vh', zIndex: 1 }}>
        {hasLocation ? (
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            style={{ width: '100%', height: '100%', filter: 'sepia(0.8) hue-rotate(-15deg) contrast(1.2) brightness(0.8)' }}
            zoomControl={false}
          >
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController onMove={updateCompassMarkers} />
            <Polyline positions={pathPositions} color="#a92929" weight={3} opacity={0.6} dashArray="10, 10" />
            {locations.map((loc, i) => (
              <Marker 
                key={loc.id || i} 
                position={[loc.lat, loc.lng]}
                eventHandlers={{
                  click: () => playSound('UI_CLICK')
                }}
              >
                <Popup><div className="skyrim-serif"><strong>{loc.label}</strong><br/>{loc.timestamp.toDate().toLocaleString()}</div></Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#1a1a1a', color: '#fff' }} className="skyrim-font">
            CONSULTING THE MAP...
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: '8rem', left: '50%', transform: 'translateX(-50%)', color: '#fff', zIndex: 10, textShadow: '2px 2px 4px #000', pointerEvents: 'none' }} className="skyrim-font">
        PAN THE MAP TO DISCOVER YOUR PATH
      </div>
    </div>
  );
};

export default Dashboard;
