import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useGame } from './context/GameContext';
import { useIsMobile } from './hooks/useIsMobile';
import HUD from './components/Skyrim/HUD';
import LoadingScreen from './components/Skyrim/LoadingScreen';
import SignUp from './components/Auth/SignUp';
import SignIn from './components/Auth/SignIn';
import ForgotPassword from './components/Auth/ForgotPassword';
import NotFound from './pages/NotFound';

// Heavy screens load on demand so the first paint only needs the shell.
const SkyrimMenu = lazy(() => import('./components/Skyrim/Menu'));
const PauseMenu = lazy(() => import('./components/Skyrim/PauseMenu'));
const Today = lazy(() => import('./pages/Today'));
const MobileToday = lazy(() => import('./mobile/MobileToday'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Skills = lazy(() => import('./pages/Skills'));
const Magic = lazy(() => import('./pages/Magic'));
const Inventory = lazy(() => import('./pages/Inventory'));
const MobileShell = lazy(() => import('./mobile/MobileShell'));
const MobileQuests = lazy(() => import('./mobile/MobileQuests'));
const MobileLog = lazy(() => import('./mobile/MobileLog'));
const MobileSkills = lazy(() => import('./mobile/MobileSkills'));
const MobileMagic = lazy(() => import('./mobile/MobileMagic'));
const MobileItems = lazy(() => import('./mobile/MobileItems'));
const MobileMap = lazy(() => import('./mobile/MobileMap'));

/** The loading screen is part of the experience: it always shows, for at least this long. */
const MIN_LOADING_MS = 2600;
const AUTH_PATHS = ['/signin', '/signup', '/forgot-password'];

const Fallback = () => <div className="route-fallback skyrim-font">LOADING...</div>;

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Fallback />;
  if (!currentUser) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
};

const Public: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <Fallback />;
  if (currentUser) return <Navigate to="/today" replace />;
  return <>{children}</>;
};

const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

function App() {
  const location = useLocation();
  const { currentUser, loading: authLoading } = useAuth();
  const { ui, setUI, statsLoaded } = useGame();
  const isMobile = useIsMobile();
  const [minTimeDone, setMinTimeDone] = useState(false);
  const skipLoading = useCallback(() => setMinTimeDone(true), []);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeDone(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  const dataReady = !authLoading && (!currentUser || statsLoaded);
  const isFirstLoad = !(minTimeDone && dataReady);
  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const inGame = !!currentUser && !isAuthPage && !isFirstLoad;
  const hideHUDForMenus = ui.isPauseMenuOpen || ui.isMenuOpen;
  const showMenuButton = !['/magic', '/inventory'].includes(location.pathname);
  const isSkillsPage = location.pathname === '/skills';

  // Desktop keyboard shortcuts: Tab for the character menu, Esc for the system menu.
  useEffect(() => {
    if (!inGame || isMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (ui.modalDepth > 0 || isTypingTarget(e.target)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setUI({ isPauseMenuOpen: !ui.isPauseMenuOpen, isMenuOpen: false });
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setUI({ isMenuOpen: !ui.isMenuOpen, isPauseMenuOpen: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ui.isPauseMenuOpen, ui.isMenuOpen, ui.modalDepth, setUI, inGame, isMobile]);

  // Warm the lazy screens once the realm is open so navigation never shows a loading flash.
  useEffect(() => {
    if (!inGame) return;
    const warm = () => {
      const loads = isMobile
        ? [() => import('./mobile/MobileToday'), () => import('./mobile/MobileQuests'), () => import('./mobile/MobileLog'), () => import('./mobile/MobileSkills'), () => import('./mobile/MobileMagic'), () => import('./mobile/MobileItems')]
        : [() => import('./pages/Today'), () => import('./pages/Dashboard'), () => import('./components/Skyrim/Menu'), () => import('./components/Skyrim/PauseMenu'), () => import('./pages/Skills'), () => import('./pages/Magic'), () => import('./pages/Inventory')];
      loads.forEach(l => { void l().catch(() => {}); });
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(warm, { timeout: 4000 });
    else setTimeout(warm, 1500);
  }, [inGame, isMobile]);

  // Close overlays when the route changes.
  useEffect(() => { setUI({ isMenuOpen: false }); }, [location.pathname, setUI]);

  const routes = (
    <Routes>
      <Route path="/signup" element={<Public><SignUp /></Public>} />
      <Route path="/signin" element={<Public><SignIn /></Public>} />
      <Route path="/forgot-password" element={<Public><ForgotPassword /></Public>} />

      <Route path="/today" element={<Protected>{isMobile ? <MobileToday /> : <Today />}</Protected>} />
      <Route path="/dashboard" element={<Protected>{isMobile ? <MobileMap /> : <Dashboard />}</Protected>} />
      <Route path="/quests" element={<Protected>{isMobile ? <MobileQuests /> : <Navigate to="/today" replace />}</Protected>} />
      <Route path="/journal" element={<Protected>{isMobile ? <MobileLog /> : <Navigate to="/today" replace />}</Protected>} />
      <Route path="/checkin" element={<Navigate to="/journal" replace />} />
      <Route path="/skills" element={<Protected>{isMobile ? <MobileSkills /> : <Skills />}</Protected>} />
      <Route path="/magic" element={<Protected>{isMobile ? <MobileMagic /> : <Magic />}</Protected>} />
      <Route path="/inventory" element={<Protected>{isMobile ? <MobileItems /> : <Inventory />}</Protected>} />

      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return (
    <div className={`app-root ${isMobile ? 'is-mobile' : 'is-desktop'}`}>
      <LoadingScreen isLoading={isFirstLoad} canSkip={dataReady} onSkip={skipLoading} />

      {inGame && isMobile ? (
        <Suspense fallback={<Fallback />}>
          <MobileShell>
            <Suspense fallback={<Fallback />}>{routes}</Suspense>
          </MobileShell>
        </Suspense>
      ) : (
        <>
          {inGame && (
            <>
              {!hideHUDForMenus && (
                <>
                  <HUD showCompass={location.pathname === '/dashboard'} showLevel={false} showBars={location.pathname !== '/today'} />
                  <button onClick={() => setUI({ isPauseMenuOpen: true, isMenuOpen: false })} className={`hud-button left skyrim-font ${isSkillsPage ? 'lowered' : ''}`}>
                    SYSTEM [ESC]
                  </button>
                </>
              )}
              {/* Overlays get their own boundaries: loading a menu must never suspend (and remount) the page beneath it. */}
              <Suspense fallback={null}>
                <SkyrimMenu hideButton={!showMenuButton || hideHUDForMenus} />
              </Suspense>
              {ui.isPauseMenuOpen && (
                <Suspense fallback={null}>
                  <PauseMenu isOpen onClose={() => setUI({ isPauseMenuOpen: false })} />
                </Suspense>
              )}
            </>
          )}
          <Suspense fallback={<Fallback />}>{routes}</Suspense>
        </>
      )}
    </div>
  );
}

export default App;
