import React, { useState } from 'react';
import { useSound } from '../../context/SoundContext';
import { XP } from '../../game/rules';
import { skillMeaning } from '../../game/skills';
import type { Quest } from '../../game/types';

interface Props {
  quest: Quest;
  onToggle: (q: Quest) => Promise<void> | void;
  onOpen?: (q: Quest) => void;
}

/** One quest with its check diamond. Completing it flashes gold and floats the XP earned. */
const QuestRow: React.FC<Props> = ({ quest, onToggle, onOpen }) => {
  const { playSound } = useSound();
  const [burst, setBurst] = useState(0);
  const xp = quest.type === 'weekly' ? XP.BOUNTY : XP.QUEST;

  const toggle = () => {
    playSound('UI_CLICK');
    if (!quest.completed) setBurst(Date.now());
    void onToggle(quest);
  };

  return (
    <div className={`quest-row ${quest.completed ? 'done' : ''} ${burst ? 'celebrate' : ''}`} key={burst}>
      <button className="m-quest-check" onClick={toggle} aria-pressed={quest.completed} aria-label={quest.completed ? 'Mark incomplete' : 'Complete quest'}>
        <span className={`quest-diamond ${quest.completed ? 'filled' : ''}`} />
      </button>
      <button className="quest-row-body" onClick={() => onOpen?.(quest)} disabled={!onOpen}>
        <span className="skyrim-font quest-row-title">{quest.title}</span>
        <span className="skyrim-serif quest-meta">{quest.type === 'weekly' ? 'BOUNTY · ' : ''}{quest.skill} <span className="meaning">· {skillMeaning(quest.skill)}</span></span>
      </button>
      {burst > 0 && <span className="xp-float skyrim-font" aria-hidden="true">+{xp} {quest.skill} XP</span>}
    </div>
  );
};

export default QuestRow;
