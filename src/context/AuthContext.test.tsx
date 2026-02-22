import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { onAuthStateChanged } from 'firebase/auth';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const TestComponent = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return <div>{currentUser ? `User: ${currentUser.email}` : 'No User'}</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading initially and then the user', async () => {
    let authCallback: any;
    (onAuthStateChanged as any).mockImplementation((auth: any, callback: any) => {
      authCallback = callback;
      return () => {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Simulate auth state change
    act(() => {
      authCallback({ email: 'test@example.com' });
    });

    await waitFor(() => {
      expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    });
  });

  it('throws error if useAuth is used outside of AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });
});
