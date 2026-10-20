// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
} from 'firebase/auth';
import type { User, UserCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential | void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Permanently delete the Firebase account. May need the password to re-authenticate. */
  deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/** Map Firebase error codes to in-world messages that do not leak account existence. */
export function describeAuthError(err: unknown): string {
  const code = (err as { code?: string } | undefined)?.code ?? '';
  switch (code) {
    case 'auth/invalid-email': return 'That is not a valid courier address.';
    case 'auth/weak-password': return 'Your pass-phrase must be at least 8 characters.';
    case 'auth/email-already-in-use': return 'A character already answers to that address. Try signing in.';
    case 'auth/too-many-requests': return 'The gate is barred for now. Too many attempts, rest and try again later.';
    case 'auth/network-request-failed': return 'The courier could not reach the realm. Check your connection.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request': return 'Sign-in was cancelled.';
    case 'auth/operation-not-allowed': return 'That way into the realm is not open on this server.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'That pass-phrase is not yours.';
    case 'auth/requires-recent-login': return 'The gate needs your pass-phrase again before it will do that.';
    default: return 'The gate did not open. Check your details and try again.';
  }
}

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
]);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Completes a redirect-based Google sign-in (mobile browsers that block popups).
    getRedirectResult(auth).catch(err => console.warn('Redirect sign-in failed', err?.code));
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    currentUser,
    loading,
    signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signInWithGoogle: async () => {
      const provider = new GoogleAuthProvider();
      try {
        return await signInWithPopup(auth, provider);
      } catch (err) {
        const code = (err as { code?: string }).code ?? '';
        if (POPUP_FALLBACK_CODES.has(code)) return signInWithRedirect(auth, provider);
        throw err;
      }
    },
    signOut: () => firebaseSignOut(auth),
    resetPassword: email => sendPasswordResetEmail(auth, email),
    deleteAccount: async password => {
      const user = auth.currentUser;
      if (!user) throw new Error('not signed in');
      try {
        await deleteUser(user);
      } catch (err) {
        if ((err as { code?: string }).code !== 'auth/requires-recent-login') throw err;
        if (user.providerData.some(p => p.providerId === 'google.com')) {
          await reauthenticateWithPopup(user, new GoogleAuthProvider());
        } else if (password && user.email) {
          await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
        } else {
          throw err;
        }
        await deleteUser(user);
      }
    },
  }), [currentUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
