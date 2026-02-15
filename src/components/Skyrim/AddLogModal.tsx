import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { captureLocation } from '../../services/locationService';
import '../../styles/Skyrim.css';

interface AddLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddLogModal: React.FC<AddLogModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { addXP, updateAttributes } = useGame();
  
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [highlights, setHighlights] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);

  const getMoodEmoji = (v: number) => ["😭","😞","😐","🙂","😄","🤩"][Math.floor((v-1)/2)] || "😐";
  const getEnergyEmoji = (v: number) => ["😴","🥱","😐","🔋","⚡","🚀"][Math.floor((v-1)/2)] || "😐";

  const handleHighlightChange = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'moodEntries'), {
        userId: currentUser.uid,
        mood,
        energy,
        sleep,
        highlights,
        timestamp: Timestamp.now(),
      });

      await updateAttributes(mood, energy, sleep);
      await addXP(50);
      
      // Capture Location
      await captureLocation(currentUser.uid, "Scribed a Daily Log");
      
      onClose();
    } catch (err) {
      console.error('Error adding document: ', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="skyrim-modal-overlay" onClick={onClose}>
      <div className="skyrim-modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="skyrim-title">SCRIBE DAILY LOG</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Mood Slider */}
          <div className="input-group">
            <label className="skyrim-font" style={{ fontSize: '0.8rem', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
              MOOD <span>{getMoodEmoji(mood)}</span>
            </label>
            <input type="range" min="1" max="10" value={mood} onChange={(e) => setMood(parseInt(e.target.value))} className="range-input" />
          </div>

          {/* Energy Slider */}
          <div className="input-group">
            <label className="skyrim-font" style={{ fontSize: '0.8rem', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
              ENERGY <span>{getEnergyEmoji(energy)}</span>
            </label>
            <input type="range" min="1" max="10" value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} className="range-input" />
          </div>

          {/* Sleep Input */}
          <div className="input-group">
            <label className="skyrim-font" style={{ fontSize: '0.8rem', color: '#888' }}>REST (HOURS)</label>
            <input 
              type="number" 
              step="0.5" 
              value={sleep} 
              onChange={(e) => setSleep(parseFloat(e.target.value))} 
              className="parchment-input" 
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #444' }}
            />
          </div>

          {/* Highlights */}
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="skyrim-font" style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>TODAY'S TRIUMPHS</label>
            {highlights.map((h, i) => (
              <input
                key={i}
                type="text"
                value={h}
                onChange={(e) => handleHighlightChange(i, e.target.value)}
                className="parchment-input"
                placeholder={`Triumph ${i + 1}...`}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #444' }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn" disabled={loading} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid var(--skyrim-gold-dim)' }}>
              {loading ? 'SCRIBING...' : 'COMMIT TO MEMORY'}
            </button>
            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#888' }}>
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLogModal;
