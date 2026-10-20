import React, { useState } from 'react';
import { LIMITS } from '../../game/rules';

interface LogFormProps {
  onSubmit: (mood: number, energy: number, sleep: number, highlights: string[]) => Promise<boolean>;
  onCancel?: () => void;
  saving: boolean;
  streak?: number;
}

export const moodEmoji = (v: number) => ['😭', '😞', '😐', '🙂', '😄', '🤩'][Math.min(5, Math.floor((v - 1) / 2))];
export const energyEmoji = (v: number) => ['😴', '🥱', '😐', '🔋', '⚡', '🚀'][Math.min(5, Math.floor((v - 1) / 2))];

/** The daily check-in. Shared by the desktop pause menu and the mobile Log tab. */
const LogForm: React.FC<LogFormProps> = ({ onSubmit, onCancel, saving, streak = 0 }) => {
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState('7');
  const [highlights, setHighlights] = useState(['', '', '']);
  const [error, setError] = useState<string | null>(null);

  const sleepNum = parseFloat(sleep);
  const sleepValid = Number.isFinite(sleepNum) && sleepNum >= 0 && sleepNum <= 24;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sleepValid) { setError('Rest must be between 0 and 24 hours.'); return; }
    setError(null);
    const ok = await onSubmit(mood, energy, sleepNum, highlights);
    if (ok) { setHighlights(['', '', '']); }
  };

  return (
    <form onSubmit={handleSubmit} className="log-form" noValidate>
      {streak > 0 && <div className="streak-pill skyrim-font">🔥 {streak} DAY STREAK</div>}

      <div className="input-group">
        <label className="skyrim-font field-label" htmlFor="log-mood">
          <span>MOOD · HEALTH</span><span className="field-value">{moodEmoji(mood)} {mood}</span>
        </label>
        <input id="log-mood" type="range" min={1} max={10} value={mood} onChange={e => setMood(Number(e.target.value))} className="range-input range-health" />
      </div>

      <div className="input-group">
        <label className="skyrim-font field-label" htmlFor="log-energy">
          <span>ENERGY · STAMINA</span><span className="field-value">{energyEmoji(energy)} {energy}</span>
        </label>
        <input id="log-energy" type="range" min={1} max={10} value={energy} onChange={e => setEnergy(Number(e.target.value))} className="range-input range-stamina" />
      </div>

      <div className="input-group">
        <label className="skyrim-font field-label" htmlFor="log-sleep"><span>REST · MAGICKA</span><span className="field-value">hours</span></label>
        <input id="log-sleep" type="number" inputMode="decimal" min={0} max={24} step={0.5} value={sleep} onChange={e => setSleep(e.target.value)} className="parchment-input dark" aria-invalid={!sleepValid} />
      </div>

      <div className="input-group">
        <div className="skyrim-font field-label"><span>TODAY'S TRIUMPHS</span><span className="field-value">optional</span></div>
        {highlights.map((h, i) => (
          <input
            key={i}
            type="text"
            value={h}
            maxLength={LIMITS.HIGHLIGHT}
            onChange={e => setHighlights(hs => hs.map((v, j) => (j === i ? e.target.value : v)))}
            className="parchment-input dark"
            placeholder={`Triumph ${i + 1}...`}
            aria-label={`Triumph ${i + 1}`}
          />
        ))}
      </div>

      {error && <p className="form-error skyrim-serif" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary skyrim-font" disabled={saving}>{saving ? 'SCRIBING...' : 'COMMIT TO MEMORY'}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost skyrim-font">CANCEL</button>}
      </div>
    </form>
  );
};

export default LogForm;
