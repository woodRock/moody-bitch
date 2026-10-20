import { useEffect, useState } from 'react';

/**
 * Phones and small tablets get the simplified "satellite" UI. The desktop
 * experience relies on trackpad gestures, hover and a wide viewport.
 */
export const MOBILE_QUERY = '(max-width: 820px), ((pointer: coarse) and (max-width: 1100px))';

export function useIsMobile(): boolean {
  const get = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_QUERY).matches
    : false;
  const [isMobile, setIsMobile] = useState(get);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
