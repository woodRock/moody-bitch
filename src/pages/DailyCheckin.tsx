// src/pages/DailyCheckin.tsx
import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import '../styles/Forms.css';

const DailyCheckin: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [mood, setMood] = useState(5); // 1-10 scale
  const [energy, setEnergy] = useState(5); // 1-10 scale
  const [sleep, setSleep] = useState(7); // Hours
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        notes,
        timestamp: Timestamp.now(),
      });
      setSuccess('Check-in submitted successfully!');
      setMood(5);
      setEnergy(5);
      setSleep(7);
      setNotes('');
      navigate('/dashboard'); // Redirect to dashboard after successful submission
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError('Error submitting check-in: ' + err.message);
      } else {
        setError('An unexpected error occurred while submitting check-in.');
      }
      console.error('Error adding document: ', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkin-container">
      <div className="checkin-box">
        <h2 className="text-center" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Daily Check-in</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="mood">
              Mood (1-10, 1=Bad, 10=Great)
            </label>
            <input
              type="range"
              id="mood"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="range-input"
            />
            <span className="range-display">{mood}</span>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="energy">
              Energy (1-10, 1=Low, 10=High)
            </label>
            <input
              type="range"
              id="energy"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="range-input"
            />
            <span className="range-display">{energy}</span>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="sleep">
              Sleep (Hours)
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

          <div className="input-group">
            <label className="input-label" htmlFor="notes">
              Journal Entry (Thoughts and Feelings)
            </label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              placeholder="What's on your mind today?"
            ></textarea>
          </div>

          <div className="input-group">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Check-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyCheckin;
