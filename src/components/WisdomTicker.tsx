import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';

const WISDOM_QUOTES = [
  "Rest is as vital as the battle itself.",
  "The longest journey begins with a single Shout.",
  "Iron is forged in fire; the mind is forged in challenge.",
  "Even the High King must sometimes pause to breathe.",
  "Focus is a blade that dulls if never sheathed.",
  "The stars guide those who look upward.",
  "A dragon does not concern himself with the opinions of sheep.",
  "True mastery is knowing when to strike and when to wait.",
  "The Thu'um is strongest when the heart is quiet.",
  "Your spirit is your greatest weapon. Keep it sharp."
];

const WisdomTicker: React.FC = () => {
  const { addWorldMessage } = useGame();

  useEffect(() => {
    const interval = setInterval(() => {
      const randomQuote = WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)];
      addWorldMessage(randomQuote);
    }, 45000); // Every 45 seconds

    return () => clearInterval(interval);
  }, [addWorldMessage]);

  return null;
};

export default WisdomTicker;
