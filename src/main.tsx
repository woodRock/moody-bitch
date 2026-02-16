import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { GameProvider } from './context/GameContext'
import { SoundProvider } from './context/SoundContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <SoundProvider>
          <GameProvider>
            <App />
          </GameProvider>
        </SoundProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
