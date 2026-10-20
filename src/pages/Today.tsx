import React from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import TodayContent from '../components/Skyrim/TodayContent';

/** Desktop home: the day's loop in one parchment panel over the stars. */
const Today: React.FC = () => {
  const { setUI } = useGame();
  const { playSound } = useSound();
  return (
    <div className="skills-container today-screen">
      <div className="star-field" />
      <div className="today-scroll">
        <TodayContent />
        <div className="today-links skyrim-font">
          <button className="btn-ghost small skyrim-font" onClick={() => { setUI({ isMenuOpen: true }); playSound('UI_CLICK'); }}>CHARACTER MENU</button>
          <button className="btn-ghost small skyrim-font" onClick={() => { setUI({ isPauseMenuOpen: true, pauseTab: 'QUESTS' }); playSound('UI_CLICK'); }}>QUEST LOG</button>
          <button className="btn-ghost small skyrim-font" onClick={() => { setUI({ isPauseMenuOpen: true, pauseTab: 'JOURNAL' }); playSound('UI_CLICK'); }}>CHRONICLES</button>
        </div>
      </div>
    </div>
  );
};

export default Today;
