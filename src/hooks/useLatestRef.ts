import { useEffect, useRef } from 'react';

/** A ref that always holds the latest value, updated after each commit. */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}
