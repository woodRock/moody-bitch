import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';
import HUD from '../components/Skyrim/HUD';
import SkyrimMenu from '../components/Skyrim/Menu';
import PauseMenu from '../components/Skyrim/PauseMenu';
import Penguin3D from '../components/Penguin3D';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <HUD />
      <SkyrimMenu onOpenPause={() => setIsPauseMenuOpen(true)} />
      <PauseMenu isOpen={isPauseMenuOpen} onClose={() => setIsPauseMenuOpen(false)} />

      {/* Centered Decorative Content */}
      <div style={{ zIndex: 10, textAlign: 'center', marginTop: '-10vh' }}>
        <h1 className="skyrim-title" style={{ fontSize: '3rem', border: 'none', marginBottom: '2rem' }}>
          TAMRIEL MAP
        </h1>
        
        <div style={{ width: '400px', height: '400px', margin: '0 auto', filter: 'drop-shadow(0 0 20px rgba(230, 194, 120, 0.2))' }}>
           <Penguin3D mood={7} energy={7} sleep={7} />
        </div>

        <p className="skyrim-font" style={{ color: '#888', marginTop: '2rem', letterSpacing: '4px' }}>
          PROVINCE OF {currentUser?.email?.split('@')[0].toUpperCase()}
        </p>
      </div>

      {/* Navigation Hint */}
      <div style={{ position: 'fixed', bottom: '10rem', color: '#555' }} className="skyrim-font">
        PRESS [ TAB ] TO OPEN CHARACTER MENU OR [ ESC ] FOR SYSTEM
      </div>
    </div>
  );
};

export default Dashboard;
