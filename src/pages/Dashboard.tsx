import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import '../styles/Dashboard.css';
import HUD from '../components/Skyrim/HUD';
import SkyrimMenu from '../components/Skyrim/Menu';
import PauseMenu from '../components/Skyrim/PauseMenu';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { fetchLocationHistory } from '../services/locationService';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { UserLocation } from '../services/locationService';
import L from 'leaflet';

// Fix for markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  type: 'quest' | 'log';
}

// Internal component to catch map movement
const MapController = ({ onMove }: { onMove: (center: L.LatLng) => void }) => {
  useMapEvents({
    move: (e) => onMove(e.target.getCenter()),
  });
  return null;
};

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { stats } = useGame();
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [activeQuests, setActiveQuests] = useState<{lat: number, lng: number, title: string}[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [hasLocation, setHasLocation] = useState(false);
  const [heading, setHeading] = useState(0); // For Device Orientation
  const [markersOnCompass, setMarkersOnCompass] = useState<{id: string, offset: number, icon: string}[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadHistory();
      // Listen for device orientation (mobile compass)
      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.webkitCompassHeading) setHeading(e.webkitCompassHeading);
        else if (e.alpha) setHeading(360 - e.alpha);
      };
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [currentUser]);

  const loadHistory = async () => {
    if (!currentUser) return;
    const history = await fetchLocationHistory(currentUser.uid);
    setLocations(history);
    
    // Also fetch locations for active quests if they have them (optional enhancement)
    // For now, let's just use the history points as compass markers
    
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

  // Calculate marker positions on the compass bar based on current map center
  const updateCompassMarkers = useCallback((center: L.LatLng) => {
    const newMarkers = locations.map(loc => {
      // Calculate bearing from center to marker
      const y = Math.sin(loc.lng - center.lng) * Math.cos(loc.lat);
      const x = Math.cos(center.lat) * Math.sin(loc.lat) -
                Math.sin(center.lat) * Math.cos(loc.lat) * Math.cos(loc.lng - center.lng);
      let bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      
      // Relative to current heading
      let relativeBearing = (bearing - heading + 540) % 360 - 180;
      
      return {
        id: loc.id || Math.random().toString(),
        offset: relativeBearing * (400 / 180), // Map -180/180 to -400/400px
        icon: loc.label?.includes('Quest') ? '📍' : '📜'
      };
    }).filter(m => Math.abs(m.offset) < 200); // Only show if within compass view range

    setMarkersOnCompass(newMarkers);
  }, [locations, heading]);

  const pathPositions = locations.map(loc => [loc.lat, loc.lng] as [number, number]);

  return (
    <div className="dashboard-container" style={{ padding: 0, overflow: 'hidden' }}>
      <HUD heading={heading} compassMarkers={markersOnCompass} />
      <SkyrimMenu onOpenPause={() => setIsPauseMenuOpen(true)} />
      <PauseMenu isOpen={isPauseMenuOpen} onClose={() => { setIsPauseMenuOpen(false); loadHistory(); }} />

      <style>{`
        .skyrim-font[style*="top: 4.5rem"] { top: 1.5rem !important; }
      `}</style>

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
              <Marker key={loc.id || i} position={[loc.lat, loc.lng]}>
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
