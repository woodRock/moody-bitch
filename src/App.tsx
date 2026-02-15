import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useGame } from './context/GameContext';
import HUD from './components/Skyrim/HUD';
import SkyrimMenu from './components/Skyrim/Menu';
import PauseMenu from './components/Skyrim/PauseMenu';
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

  const isAuthPage = ['/signin', '/signup', '/forgot-password'].includes(location.pathname);
  const showHUD = !!currentUser && !isAuthPage;

  return (
    <div className="app-root">
      {showHUD && (
        <>
          <HUD 
            showCompass={location.pathname === '/dashboard'} 
            showLevel={location.pathname !== '/skills'} 
          />
          <SkyrimMenu 
            onOpenPause={() => setUI({ isPauseMenuOpen: true })} 
            disabledGestures={ui.disabledGestures}
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
        <Route path="/checkin" element={<ProtectedRoute><DailyCheckin /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
        <Route path="/quests" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
