import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { WISDOM_QUOTES } from '../game/spells';

const WisdomTicker: React.FC = () => {
  const { addWorldMessage } = useGame();

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      addWorldMessage(WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)]);
    }, 45_000);
    return () => clearInterval(interval);
  }, [addWorldMessage]);

  return null;
};

export default WisdomTicker;
