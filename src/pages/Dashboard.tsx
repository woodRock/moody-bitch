import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';
import HUD from '../components/Skyrim/HUD';
import SkyrimMenu from '../components/Skyrim/Menu';
import PauseMenu from '../components/Skyrim/PauseMenu';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { fetchLocationHistory } from '../services/locationService';
import type { UserLocation } from '../services/locationService';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadHistory();
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

  const pathPositions = locations.map(loc => [loc.lat, loc.lng] as [number, number]);

  return (
    <div className="dashboard-container" style={{ padding: 0, overflow: 'hidden' }}>
      <HUD />
      <SkyrimMenu onOpenPause={() => setIsPauseMenuOpen(true)} />
      <PauseMenu isOpen={isPauseMenuOpen} onClose={() => { setIsPauseMenuOpen(false); loadHistory(); }} />

      {/* Button position override */}
      <style>{`
        .skyrim-font[style*="top: 4.5rem"] { top: 1.5rem !important; }
      `}</style>

      {/* Medieval Map */}
      <div className="map-wrapper" style={{ width: '100vw', height: '100vh', zIndex: 1 }}>
        {hasLocation ? (
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            style={{ width: '100%', height: '100%', filter: 'sepia(0.8) hue-rotate(-15deg) contrast(1.2) brightness(0.8)' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Polyline positions={pathPositions} color="#a92929" weight={3} opacity={0.6} dashArray="10, 10" />

            {locations.map((loc, i) => (
              <Marker key={loc.id || i} position={[loc.lat, loc.lng]}>
                <Popup>
                  <div className="skyrim-serif">
                    <strong>{loc.label || "Journey Point"}</strong><br />
                    {loc.timestamp.toDate().toLocaleString()}
                  </div>
                </Popup>
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
        PRESS [ TAB ] FOR CHARACTER MENU OR [ ESC ] FOR SYSTEM
      </div>
    </div>
  );
};

export default Dashboard;
