import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp, 
  deleteDoc 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';

interface Quest {
  id: string;
  title: string;
  type: 'daily' | 'one-off';
  completed: boolean;
  lastCompleted?: Timestamp;
}

const Quests: React.FC = () => {
  const { currentUser } = useAuth();
  const { addXP, notify } = useGame();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestType, setNewQuestType] = useState<'daily' | 'one-off'>('one-off');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
  }, [currentUser]);

  const fetchQuests = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'quests'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedQuests: Quest[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quest[];

      // Reset dailies if needed
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      const processedQuests = await Promise.all(fetchedQuests.map(async (quest) => {
        if (quest.type === 'daily' && quest.completed && quest.lastCompleted) {
          const lastDate = quest.lastCompleted.toDate();
          const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
          
          if (lastDay < today) {
            // Reset daily quest
            await updateDoc(doc(db, 'quests', quest.id), { completed: false });
            return { ...quest, completed: false };
          }
        }
        return quest;
      }));

      setQuests(processedQuests);
    } catch (error) {
      console.error("Error fetching quests:", error);
    } finally {
      setLoading(false);
    }
  };

  const addQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestTitle.trim() || !currentUser) return;

    try {
      const docRef = await addDoc(collection(db, 'quests'), {
        userId: currentUser.uid,
        title: newQuestTitle,
        type: newQuestType,
        completed: false,
        createdAt: Timestamp.now()
      });
      setQuests([...quests, { 
        id: docRef.id, 
        title: newQuestTitle, 
        type: newQuestType, 
        completed: false 
      }]);
      setNewQuestTitle('');
    } catch (error) {
      console.error("Error adding quest:", error);
    }
  };

  const toggleQuest = async (quest: Quest) => {
    try {
      const newStatus = !quest.completed;
      await updateDoc(doc(db, 'quests', quest.id), {
        completed: newStatus,
        lastCompleted: newStatus ? Timestamp.now() : quest.lastCompleted
      });

      if (newStatus) {
        notify("QUEST COMPLETED", quest.title.toUpperCase());
        addXP(25);
      }

      setQuests(quests.map(q => q.id === quest.id ? { ...q, completed: newStatus } : q));
    } catch (error) {
      console.error("Error updating quest:", error);
    }
  };

  const deleteQuest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'quests', id));
      setQuests(quests.filter(q => q.id !== id));
    } catch (error) {
      console.error("Error deleting quest:", error);
    }
  };

  return (
    <div className="skyrim-quest-container">
      <h2 className="skyrim-title" style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1.5rem', border: 'none' }}>ACTIVE QUESTS</h2>
      
      <form onSubmit={addQuest} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={newQuestTitle}
          onChange={(e) => setNewQuestTitle(e.target.value)}
          placeholder="New Quest Name..."
          className="form-input parchment-input"
          style={{ flex: 1, minWidth: '200px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--skyrim-gold-dim)', color: '#fff' }}
        />
        <select 
          value={newQuestType} 
          onChange={(e) => setNewQuestType(e.target.value as any)}
          className="form-input parchment-input"
          style={{ width: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--skyrim-gold-dim)', color: '#fff' }}
        >
          <option value="one-off" style={{ background: '#1a1a1a' }}>Side Quest</option>
          <option value="daily" style={{ background: '#1a1a1a' }}>Daily Misc</option>
        </select>
        <button type="submit" className="btn" style={{ padding: '0.5rem 1rem' }}>ADD</button>
      </form>

      <div className="menu-separator" style={{ marginBottom: '1rem' }}></div>

      {loading ? (
        <p className="text-center skyrim-serif">Consulting the scrolls...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {quests.map(quest => (
            <li key={quest.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '1rem 0',
              borderBottom: '1px solid rgba(197, 160, 89, 0.2)',
              opacity: quest.completed ? 0.4 : 1,
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div 
                  onClick={() => toggleQuest(quest)}
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    border: '2px solid var(--skyrim-gold-dim)', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: quest.completed ? 'var(--skyrim-gold-dim)' : 'transparent',
                    boxShadow: quest.completed ? '0 0 10px var(--skyrim-gold-dim)' : 'none'
                  }}
                >
                  {quest.completed && <span style={{ color: '#000', fontWeight: 'bold' }}>✓</span>}
                </div>
                <span className="skyrim-font" style={{ 
                  textDecoration: quest.completed ? 'line-through' : 'none',
                  fontSize: '1.1rem',
                  color: quest.completed ? '#777' : '#fff',
                  letterSpacing: '1px'
                }}>
                  {quest.title} {quest.type === 'daily' && <small style={{ color: 'var(--skyrim-gold-dim)', marginLeft: '10px' }}>[DAILY]</small>}
                </span>
              </div>
              <button 
                onClick={() => deleteQuest(quest.id)} 
                style={{ background: 'none', border: 'none', color: '#a92929', cursor: 'pointer', fontSize: '1.5rem', opacity: 0.6 }}
              >
                &times;
              </button>
            </li>
          ))}
          {quests.length === 0 && <p className="text-center skyrim-serif" style={{ color: '#777' }}>No quests in your log.</p>}
        </ul>
      )}
    </div>
  );
};

export default Quests;
