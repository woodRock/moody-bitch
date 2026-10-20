/** Compass and bearing maths shared by the HUD compass and the Journey Map. */

export interface LatLng { lat: number; lng: number }

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Initial bearing in degrees (0 = north, clockwise) from `from` to `to`. */
export function bearing(from: LatLng, to: LatLng): number {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/** Signed difference `target - heading` normalised to [-180, 180). */
export function relativeBearing(target: number, heading: number): number {
  return ((target - heading + 540) % 360) - 180;
}

/** Great-circle distance in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** The compass strip shows this many degrees across its full width. */
export const COMPASS_FOV = 180;

/** Pixel offset from the compass centre for a relative bearing. */
export function compassOffset(rel: number, widthPx: number): number {
  return (rel / COMPASS_FOV) * widthPx;
}
