import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Firebase so tests never touch the network.
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(() => Promise.resolve(null)),
  deleteUser: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('../firebaseConfig', () => ({
  auth: {},
  db: {},
}));

// jsdom has no matchMedia.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}
