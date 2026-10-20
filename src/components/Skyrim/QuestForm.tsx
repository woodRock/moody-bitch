import React, { useState } from 'react';
import { LIMITS } from '../../game/rules';
import { SKILL_KEYS } from '../../game/types';
import { skillMeaning } from '../../game/skills';
import type { Quest, QuestType } from '../../game/types';

interface QuestFormProps {
  onSubmit: (title: string, type: QuestType, skill: string) => Promise<Quest | null>;
  onDone: (quest: Quest | null) => void;
  onCancel?: () => void;
  adding: boolean;
}

const QuestForm: React.FC<QuestFormProps> = ({ onSubmit, onDone, onCancel, adding }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<QuestType>('one-off');
  const [skill, setSkill] = useState<string>('RESTORATION');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || adding) return;
    const q = await onSubmit(title, type, skill);
    if (q) setTitle('');
    onDone(q);
  };

  return (
    <form onSubmit={submit} className="log-form">
      <div className="input-group">
        <label className="skyrim-font field-label" htmlFor="quest-title"><span>QUEST NAME</span><span className="field-value">{title.length}/{LIMITS.QUEST_TITLE}</span></label>
        <input id="quest-title" type="text" className="parchment-input dark" placeholder="What is your objective?" value={title} maxLength={LIMITS.QUEST_TITLE} onChange={e => setTitle(e.target.value)} required autoComplete="off" />
      </div>
      <div className="input-group">
        <label className="skyrim-font field-label" htmlFor="quest-skill"><span>TARGET SKILL</span></label>
        <select id="quest-skill" className="parchment-input dark" value={skill} onChange={e => setSkill(e.target.value)}>
          {SKILL_KEYS.map(s => <option key={s} value={s}>{s} · {skillMeaning(s)}</option>)}
        </select>
        <div className="skyrim-serif field-hint">In real life: <em>{skillMeaning(skill)}</em>. Completing this quest trains that.</div>
      </div>
      <div className="input-group">
        <label className="skyrim-font field-label" htmlFor="quest-type"><span>FREQUENCY</span></label>
        <select id="quest-type" className="parchment-input dark" value={type} onChange={e => setType(e.target.value as QuestType)}>
          <option value="one-off">Side Quest (once)</option>
          <option value="daily">Daily Misc (resets at midnight)</option>
          <option value="weekly">Bounty (once a week, triple XP, guaranteed loot)</option>
        </select>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary skyrim-font" disabled={adding || !title.trim()}>{adding ? 'THE SCRIBE WRITES...' : 'ACCEPT QUEST'}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost skyrim-font">CANCEL</button>}
      </div>
    </form>
  );
};

export default QuestForm;
