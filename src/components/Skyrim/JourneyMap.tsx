import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { UserLocation } from '../../services/locationService';
import type { LatLng } from '../../game/geo';

const questIcon = L.divIcon({ className: 'journey-marker quest', html: '◆', iconSize: [20, 20], iconAnchor: [10, 10] });
const logIcon = L.divIcon({ className: 'journey-marker log', html: '✦', iconSize: [20, 20], iconAnchor: [10, 10] });
const clusterIcon = (n: number) => L.divIcon({ className: 'journey-cluster', html: `<span>${n}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });

const CLUSTER_PX = 48;

interface Cluster { lat: number; lng: number; items: UserLocation[] }

/** Group points that fall within the same screen-space cell at the current zoom. */
function clusterize(map: L.Map, locations: UserLocation[], zoom: number): Cluster[] {
  const cells = new Map<string, Cluster>();
  for (const loc of locations) {
    const p = map.project([loc.lat, loc.lng], zoom);
    const key = `${Math.floor(p.x / CLUSTER_PX)}:${Math.floor(p.y / CLUSTER_PX)}`;
    const c = cells.get(key);
    if (c) { c.items.push(loc); } else { cells.set(key, { lat: 0, lng: 0, items: [loc] }); }
  }
  return [...cells.values()].map(c => ({
    items: c.items,
    lat: c.items.reduce((a, l) => a + l.lat, 0) / c.items.length,
    lng: c.items.reduce((a, l) => a + l.lng, 0) / c.items.length,
  }));
}

const MapEvents = ({ onMove }: { onMove: (c: LatLng) => void }) => {
  useMapEvents({ move: e => { const c = e.target.getCenter(); onMove({ lat: c.lat, lng: c.lng }); } });
  return null;
};

const Markers: React.FC<{ locations: UserLocation[]; onMarkerClick?: () => void }> = ({ locations, onMarkerClick }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const clusters = useMemo(() => clusterize(map, locations, zoom), [map, locations, zoom]);
  return (
    <>
      {clusters.map((c, i) => c.items.length === 1 ? (
        <Marker key={c.items[0].id ?? i} position={[c.lat, c.lng]} icon={c.items[0].label?.includes('Completed') ? questIcon : logIcon} eventHandlers={{ click: () => onMarkerClick?.() }}>
          <Popup>
            <div className="skyrim-serif map-popup">
              <strong>{c.items[0].label || 'A moment'}</strong><br />
              {c.items[0].timestamp?.toDate?.().toLocaleString()}
            </div>
          </Popup>
        </Marker>
      ) : (
        <Marker key={`c${i}`} position={[c.lat, c.lng]} icon={clusterIcon(c.items.length)} eventHandlers={{ click: () => { onMarkerClick?.(); map.setView([c.lat, c.lng], Math.min(map.getZoom() + 2, 18)); } }}>
          <Popup>
            <div className="skyrim-serif map-popup">
              <strong>{c.items.length} moments here</strong><br />
              {c.items[0].timestamp?.toDate?.().toLocaleDateString()} to {c.items[c.items.length - 1].timestamp?.toDate?.().toLocaleDateString()}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const Recenter: React.FC<{ center: LatLng }> = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng]); }, [map, center.lat, center.lng]);
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
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="journey-map" zoomControl={false} attributionControl={true} preferCanvas={true}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" updateWhenZooming={false} updateWhenIdle={true} keepBuffer={4} />
      <MapEvents onMove={onMove} />
      <Recenter center={center} />
      {path.length > 1 && <Polyline positions={path} color="#a92929" weight={3} opacity={0.7} dashArray="10, 10" />}
      <Markers locations={locations} onMarkerClick={onMarkerClick} />
    </MapContainer>
  );
};

export default JourneyMap;
