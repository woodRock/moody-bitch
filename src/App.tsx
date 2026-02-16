import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useGame } from './context/GameContext';
import HUD from './components/Skyrim/HUD';
import SkyrimMenu from './components/Skyrim/Menu';
import PauseMenu from './components/Skyrim/PauseMenu';
import LoadingScreen from './components/Skyrim/LoadingScreen';
import SignUp from './components/Auth/SignUp';
import SignIn from './components/Auth/SignIn';
import ForgotPassword from './components/Auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import DailyCheckin from './pages/DailyCheckin';
import Journal from './pages/Journal';
import Skills from './pages/Skills';
import Magic from './pages/Magic';
import Inventory from './pages/Inventory';
import NotFound from './pages/NotFound';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="skyrim-font" style={{color: '#fff', textAlign: 'center', marginTop: '20vh'}}>LOADING REALM...</div>;
  if (!currentUser) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

function App() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { ui, setUI } = useGame();
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsFirstLoad(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const isAuthPage = ['/signin', '/signup', '/forgot-password'].includes(location.pathname);
  const showHUD = !!currentUser && !isAuthPage && !isFirstLoad;
  const hideHUDForMenus = ui.isPauseMenuOpen || ui.isMenuOpen;
  const showMenuButton = !['/magic', '/inventory'].includes(location.pathname);
  const isSkillsPage = location.pathname === '/skills';

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAuthPage || isFirstLoad) return;
      if (e.key === 'Escape') {
        setUI({ isPauseMenuOpen: !ui.isPauseMenuOpen, isMenuOpen: false });
      }
      if (e.key === 'Tab') {
        e.preventDefault(); 
        setUI({ isMenuOpen: !ui.isMenuOpen, isPauseMenuOpen: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ui.isPauseMenuOpen, ui.isMenuOpen, setUI, isAuthPage, isFirstLoad]);

  return (
    <div className="app-root">
      <LoadingScreen isLoading={isFirstLoad} />

      {showHUD && (
        <>
          {!hideHUDForMenus && (
            <>
              <HUD 
                showCompass={location.pathname === '/dashboard' || location.pathname === '/quests'} 
                showLevel={location.pathname !== '/skills'} 
              />
              <button 
                onClick={() => setUI({ isPauseMenuOpen: !ui.isPauseMenuOpen, isMenuOpen: false })}
                className="skyrim-font"
                style={{
                  position: 'fixed', 
                  top: isSkillsPage ? '5rem' : '1.5rem', 
                  left: '2rem',
                  background: 'rgba(0,0,0,0.5)', border: '1px solid var(--skyrim-gold-dim)',
                  color: '#aaa', fontSize: '0.8rem', padding: '0.4rem 0.8rem',
                  cursor: 'pointer', zIndex: 200, textShadow: '1px 1px 0 #000'
                }}
              >
                SYSTEM [ESC]
              </button>
            </>
          )}
          <SkyrimMenu 
            disabledGestures={ui.disabledGestures}
            hideButton={!showMenuButton || hideHUDForMenus}
          />
          <PauseMenu 
            isOpen={ui.isPauseMenuOpen} 
            onClose={() => setUI({ isPauseMenuOpen: false })} 
          />
        </>
      )}

      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/quests" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><DailyCheckin /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
        <Route path="/magic" element={<ProtectedRoute><Magic /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
