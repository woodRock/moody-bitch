// src/pages/DailyCheckin.tsx
import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { useGame } from '../context/GameContext';
import '../styles/Forms.css';

const DailyCheckin: React.FC = () => {
  const { currentUser } = useAuth();
  const { addXP, updateAttributes } = useGame();
  const navigate = useNavigate();
  const [mood, setMood] = useState(5); // 1-10 scale
  const [energy, setEnergy] = useState(5); // 1-10 scale
  const [sleep, setSleep] = useState(7); // Hours
  const [highlights, setHighlights] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getMoodEmoji = (value: number) => {
    if (value <= 2) return '😭';
    if (value <= 4) return '😞';
    if (value === 5) return '😐';
    if (value <= 7) return '🙂';
    if (value <= 9) return '😄';
    return '🤩';
  };

  const getEnergyEmoji = (value: number) => {
    if (value <= 2) return '😴';
    if (value <= 4) return '🥱';
    if (value === 5) return '😐';
    if (value <= 7) return '🔋';
    if (value <= 9) return '⚡';
    return '🚀';
  };

  const handleHighlightChange = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to submit a check-in.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await addDoc(collection(db, 'moodEntries'), {
        userId: currentUser.uid,
        mood,
        energy,
        sleep,
        highlights,
        timestamp: Timestamp.now(),
      });

      // Update RPG Stats
      await updateAttributes(mood, energy, sleep);
      await addXP(50); // 50 XP for daily checkin

      setSuccess('Log updated. Your saga continues. (50 XP Gained)');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError('The gods frown upon this entry: ' + err.message);
      } else {
        setError('An unexpected error occurred in the realm.');
      }
      console.error('Error adding document: ', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkin-container">
      <div className="checkin-box card">
        <Link to="/dashboard" className="btn" style={{ marginBottom: '2rem', display: 'inline-block' }}>
          &larr; Return to Map
        </Link>
        <h2 className="text-center skyrim-title" style={{ marginBottom: '2rem', fontSize: '2rem', letterSpacing: '4px' }}>DAILY LOG</h2>
        
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="mood">
              MOOD <span className="emoji-display">{getMoodEmoji(mood)}</span>
            </label>
            <div className="range-wrapper">
              <input
                type="range"
                id="mood"
                min="1"
                max="10"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="range-input"
              />
              <span className="range-value">{mood}</span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="energy">
              ENERGY <span className="emoji-display">{getEnergyEmoji(energy)}</span>
            </label>
            <div className="range-wrapper">
              <input
                type="range"
                id="energy"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="range-input"
              />
              <span className="range-value">{energy}</span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="sleep">
              REST (HOURS)
            </label>
            <input
              type="number"
              id="sleep"
              min="0"
              max="24"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value))}
              className="form-input"
              required
            />
          </div>

          <div className="highlights-section" style={{ marginTop: '2rem' }}>
            <h3 className="skyrim-title" style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>TODAY'S HIGHLIGHTS</h3>
            {highlights.map((h, i) => (
              <div key={i} className="input-group">
                <input
                  type="text"
                  value={h}
                  onChange={(e) => handleHighlightChange(i, e.target.value)}
                  className="form-input parchment-input"
                  placeholder={`Highlight ${i + 1}...`}
                  required={i === 0}
                />
              </div>
            ))}
          </div>

          <div className="input-group" style={{ marginTop: '3rem', textAlign: 'center' }}>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ padding: '1rem', background: 'var(--skyrim-stone)', color: 'var(--skyrim-gold)', border: '1px solid var(--skyrim-gold)' }}
            >
              {loading ? 'SCRIBING...' : 'COMMIT TO MEMORY'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyCheckin;
