import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureLocation } from './locationService';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
  }
}));

vi.mock('../firebaseConfig', () => ({
  db: {}
}));

describe('locationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) =>
        success({
          coords: {
            latitude: 51.5074,
            longitude: -0.1278,
          },
        })
      ),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });
  });

  it('captures location and saves to firestore', async () => {
    const userId = 'user-123';
    const label = 'Test Label';
    
    await captureLocation(userId, label);
    
    expect(addDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
      userId,
      lat: 51.5074,
      lng: -0.1278,
      label
    }));
  });

  it('warns if geolocation is not supported', async () => {
    vi.stubGlobal('navigator', {});
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await captureLocation('user-123');
    
    expect(consoleSpy).toHaveBeenCalledWith("Geolocation is not supported by this browser.");
  });
});
