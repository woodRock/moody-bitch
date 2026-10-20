import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { UserLocation } from '../../services/locationService';
import type { LatLng } from '../../game/geo';

const questIcon = L.divIcon({ className: 'journey-marker quest', html: '◆', iconSize: [20, 20], iconAnchor: [10, 10] });
const logIcon = L.divIcon({ className: 'journey-marker log', html: '✦', iconSize: [20, 20], iconAnchor: [10, 10] });

const MapEvents = ({ onMove }: { onMove: (c: LatLng) => void }) => {
  useMapEvents({ move: e => { const c = e.target.getCenter(); onMove({ lat: c.lat, lng: c.lng }); } });
  return null;
};

interface Props {
  locations: UserLocation[];
  center: LatLng;
  onMove: (c: LatLng) => void;
  onMarkerClick?: () => void;
  zoom?: number;
}

/** The sepia parchment map of everywhere the player has done something notable. */
const JourneyMap: React.FC<Props> = ({ locations, center, onMove, onMarkerClick, zoom = 13 }) => {
  const path = useMemo(() => locations.map(l => [l.lat, l.lng] as [number, number]), [locations]);
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="journey-map" zoomControl={false} attributionControl={true}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapEvents onMove={onMove} />
      {path.length > 1 && <Polyline positions={path} color="#a92929" weight={3} opacity={0.7} dashArray="10, 10" />}
      {locations.map((loc, i) => (
        <Marker key={loc.id ?? i} position={[loc.lat, loc.lng]} icon={loc.label?.includes('Completed') ? questIcon : logIcon} eventHandlers={{ click: () => onMarkerClick?.() }}>
          <Popup>
            <div className="skyrim-serif map-popup">
              <strong>{loc.label || 'A moment'}</strong><br />
              {loc.timestamp?.toDate?.().toLocaleString()}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default JourneyMap;
