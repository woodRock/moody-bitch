import { useCallback, useEffect, useRef, useState } from 'react';

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

type Permission = 'unknown' | 'granted' | 'denied' | 'unsupported';

/**
 * Real compass heading from the device's sensors, so the HUD compass turns
 * with the phone. iOS requires an explicit permission request from a tap.
 */
export function useDeviceHeading(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] = useState<Permission>(() =>
    typeof window !== 'undefined' && 'DeviceOrientationEvent' in window ? 'unknown' : 'unsupported');
  const raf = useRef<number | null>(null);
  const pending = useRef<number | null>(null);

  const requestPermission = useCallback(async () => {
    const ctor = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<'granted' | 'denied'> } }).DeviceOrientationEvent;
    if (ctor?.requestPermission) {
      try {
        const res = await ctor.requestPermission();
        setPermission(res === 'granted' ? 'granted' : 'denied');
      } catch {
        setPermission('denied');
      }
    } else if (ctor) {
      setPermission('granted');
    } else {
      setPermission('unsupported');
    }
  }, []);

  useEffect(() => {
    if (!enabled || permission !== 'granted') return;
    const handler = (e: DeviceOrientationEvent) => {
      const ios = (e as DeviceOrientationEventiOS).webkitCompassHeading;
      let h: number | null = null;
      if (typeof ios === 'number' && Number.isFinite(ios)) h = ios;
      else if (e.absolute && typeof e.alpha === 'number') h = (360 - e.alpha) % 360;
      if (h === null) return;
      pending.current = h;
      if (raf.current === null) {
        raf.current = requestAnimationFrame(() => {
          raf.current = null;
          if (pending.current !== null) setHeading(pending.current);
        });
      }
    };
    const absolute = 'ondeviceorientationabsolute' in window;
    const type = absolute ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(type, handler as EventListener, true);
    return () => {
      window.removeEventListener(type, handler as EventListener, true);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [enabled, permission]);

  return { heading, permission, requestPermission };
}
