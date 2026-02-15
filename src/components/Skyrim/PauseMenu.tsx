import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { db } from '../../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { generateQuestLore } from '../../services/loreService';
import '../../styles/Skyrim.css';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'one-off';
  skill: string; // The skill this quest improves
  completed: boolean;
  lastCompleted?: Timestamp;
}

interface MoodEntry {
  id: string;
  mood: number;
  energy: number;
  sleep: number;
  highlights: string[];
  timestamp: Timestamp;
}

interface PauseMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'QUESTS' | 'STATS' | 'JOURNAL';

const PauseMenu: React.FC<PauseMenuProps> = ({ isOpen, onClose }) => {
  const { stats, notify, addXP } = useGame();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('QUESTS');
  
  // Quest State
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestType, setNewQuestType] = useState<'daily' | 'one-off'>('one-off');
  const [newQuestSkill, setNewQuestSkill] = useState('RESTORATION');
  
  // Journal State
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  
  const [isAddingQuest, setIsAddingQuest] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchData();
    }
  }, [isOpen, currentUser]);

  const sortQuests = (list: Quest[]) => {
    return [...list].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  };

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const qQuests = query(collection(db, 'quests'), where('userId', '==', currentUser.uid));
      const questSnap = await getDocs(qQuests);
      const fetchedQuests = questSnap.docs.map(doc => ({ id: doc.id, description: '', skill: 'RESTORATION', ...doc.data() })) as Quest[];
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const processedQuests = await Promise.all(fetchedQuests.map(async (q) => {
        if (q.type === 'daily' && q.completed && q.lastCompleted) {
          const lastDay = new Date(q.lastCompleted.toDate().getFullYear(), q.lastCompleted.toDate().getMonth(), q.lastCompleted.toDate().getDate()).getTime();
          if (lastDay < today) {
            await updateDoc(doc(db, 'quests', q.id), { completed: false });
            return { ...q, completed: false };
          }
        }
        return q;
      }));
      
      const sorted = sortQuests(processedQuests);
      setQuests(sorted);
      if (sorted.length > 0 && !selectedQuest) setSelectedQuest(sorted[0]);

      const qJournal = query(collection(db, 'moodEntries'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
      const journalSnap = await getDocs(qJournal);
      const fetchedEntries = journalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MoodEntry[];
      setEntries(fetchedEntries);
      if (fetchedEntries.length > 0 && !selectedEntry) setSelectedEntry(fetchedEntries[0]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const addQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestTitle.trim() || !currentUser || isAddingQuest) return;
    setIsAddingQuest(true);
    try {
      const desc = await generateQuestLore(newQuestTitle, newQuestType);
      const docRef = await addDoc(collection(db, 'quests'), {
        userId: currentUser.uid,
        title: newQuestTitle,
        description: desc,
        type: newQuestType,
        skill: newQuestSkill,
        completed: false,
        createdAt: Timestamp.now()
      });
      const q: Quest = { id: docRef.id, title: newQuestTitle, description: desc, type: newQuestType, skill: newQuestSkill, completed: false };
      setQuests(sortQuests([...quests, q]));
      setSelectedQuest(q);
      setNewQuestTitle('');
    } catch (error) {
      console.error("Error adding quest:", error);
    } finally {
      setIsAddingQuest(false);
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
        // Reward specific skill
        addXP(40, quest.skill); 
      }
      const updated = sortQuests(quests.map(q => q.id === quest.id ? { ...q, completed: newStatus } : q));
      setQuests(updated);
      if (selectedQuest?.id === quest.id) setSelectedQuest({ ...selectedQuest, completed: newStatus });
    } catch (error) {
      console.error("Error updating quest:", error);
    }
  };

  const deleteQuest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'quests', id));
      const updated = quests.filter(q => q.id !== id);
      setQuests(updated);
      if (selectedQuest?.id === id) setSelectedQuest(updated.length > 0 ? updated[0] : null);
    } catch (error) {
      console.error("Error deleting quest:", error);
    }
  };

  const chartData = [...entries].reverse().map((entry) => ({
    date: entry.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: entry.mood,
    energy: entry.energy,
    sleep: entry.sleep,
  }));

  if (!isOpen) return null;

  return (
    <div className="pause-menu-overlay" onClick={onClose}>
      <div className="pause-menu-container" onClick={e => e.stopPropagation()}>
        <div className="pause-menu-tabs">
          {(['QUESTS', 'STATS', 'JOURNAL'] as Tab[]).map(tab => (
            <div key={tab} className={`pause-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>

        <div className="pause-content">
          {activeTab === 'QUESTS' && (
            <div className="quest-menu-layout">
              <div className="quest-list-column">
                <div className="quest-category-title">Active Quests</div>
                <div style={{ overflowY: 'auto', maxHeight: '40vh', paddingRight: '1rem' }}>
                  {quests.map(q => (
                    <div key={q.id} className={`quest-list-item ${selectedQuest?.id === q.id ? 'active' : ''}`} onClick={() => setSelectedQuest(q)}>
                      <div className={`quest-diamond ${q.completed ? 'filled' : ''}`}></div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="skyrim-font" style={{ fontSize: '0.9rem' }}>{q.title}</span>
                        <span className="skyrim-serif" style={{ fontSize: '0.7rem', color: '#666' }}>{q.skill}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={addQuest} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="text" className="parchment-input" placeholder="New quest..." value={newQuestTitle} onChange={e => setNewQuestTitle(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #444' }} />
                  <select className="parchment-input" value={newQuestSkill} onChange={e => setNewQuestSkill(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #444' }}>
                    {Object.keys(stats.skills).map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select className="parchment-input" value={newQuestType} onChange={e => setNewQuestType(e.target.value as any)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #444' }}>
                      <option value="one-off" style={{ background: '#1a1a1a' }}>Side Quest</option>
                      <option value="daily" style={{ background: '#1a1a1a' }}>Daily Misc</option>
                    </select>
                    <button type="submit" className="btn" disabled={isAddingQuest}>{isAddingQuest ? '...' : 'ADD'}</button>
                  </div>
                </form>
              </div>
              <div className="quest-details-column">
                {selectedQuest ? (
                  <>
                    <h1 className="skyrim-font" style={{ color: '#fff', fontSize: '2rem', marginBottom: '0.5rem' }}>{selectedQuest.title.toUpperCase()}</h1>
                    <div className="menu-separator" style={{ width: '100%', marginBottom: '1.5rem', opacity: 0.3 }}></div>
                    <p className="quest-description">{selectedQuest.description}</p>
                    <div className="quest-category-title" style={{ fontSize: '0.7rem', marginTop: '2rem' }}>Objectives</div>
                    <div className="objective-item" onClick={() => toggleQuest(selectedQuest)} style={{ cursor: 'pointer' }}>
                      <div className={`objective-marker ${selectedQuest.completed ? 'completed' : ''}`}></div>
                      <span className="skyrim-serif" style={{ color: selectedQuest.completed ? '#666' : '#fff' }}>
                        Invest in the {selectedQuest.skill} skill by completing this task.
                      </span>
                    </div>
                    <div style={{ marginTop: '4rem' }}>
                       <button onClick={() => deleteQuest(selectedQuest.id)} className="btn" style={{ border: '1px solid #a92929', color: '#a92929', fontSize: '0.7rem', background: 'transparent' }}>ABANDON QUEST</button>
                    </div>
                  </>
                ) : <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.3 }}><p className="skyrim-serif" style={{ fontSize: '1.5rem' }}>Select a quest</p></div>}
              </div>
            </div>
          )}

          {activeTab === 'STATS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h2 className="skyrim-title" style={{ border: 'none', textAlign: 'center', marginBottom: '2rem' }}>LINEAGE OF SPIRIT</h2>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#e6c278" fontSize={12} />
                      <YAxis stroke="#e6c278" fontSize={12} domain={[0, 10]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a0520', border: '1px solid #c5a059', color: '#fff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="mood" stroke="#c00" strokeWidth={3} name="Health" />
                      <Line type="monotone" dataKey="energy" stroke="#080" strokeWidth={3} name="Stamina" />
                      <Line type="monotone" dataKey="sleep" stroke="#008" strokeWidth={3} name="Magicka" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="skyrim-card" style={{ padding: '1.5rem' }}>
                  <h3 className="skyrim-font" style={{ color: '#e6c278', marginBottom: '1rem' }}>CHARACTER</h3>
                  <div className="stat-row"><span className="stat-label" style={{color: '#888'}}>Level</span><span className="stat-value" style={{color: '#fff'}}>{stats.level}</span></div>
                  <div className="stat-row"><span className="stat-label" style={{color: '#888'}}>Skill Points</span><span className="stat-value" style={{color: '#e6c278'}}>{stats.skillPoints}</span></div>
                </div>
                <div className="skyrim-card" style={{ padding: '1.5rem' }}>
                  <h3 className="skyrim-font" style={{ color: '#e6c278', marginBottom: '1rem' }}>SKILLS</h3>
                  {Object.entries(stats.skills).map(([name, data]) => (
                    <div key={name} className="stat-row" style={{ fontSize: '0.9rem' }}>
                      <span className="stat-label" style={{color: '#888'}}>{name}</span><span className="stat-value" style={{color: '#fff'}}>LVL {data.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'JOURNAL' && (
            <div className="quest-menu-layout">
              <div className="quest-list-column">
                <div className="quest-category-title">Past Chronicles</div>
                <div style={{ overflowY: 'auto', maxHeight: '50vh', paddingRight: '1rem' }}>
                  {entries.map(e => (
                    <div key={e.id} className={`quest-list-item ${selectedEntry?.id === e.id ? 'active' : ''}`} onClick={() => setSelectedEntry(e)}>
                      <div className="quest-diamond filled" style={{ width: '8px', height: '8px' }}></div>
                      <span className="skyrim-font" style={{ fontSize: '0.9rem' }}>{e.timestamp.toDate().toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <button onClick={() => { onClose(); navigate('/checkin'); }} className="btn" style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem' }}>SCRIBE NEW CHRONICLE</button>
                </div>
              </div>
              <div className="quest-details-column">
                {selectedEntry ? (
                  <>
                    <h1 className="skyrim-font" style={{ color: '#fff', fontSize: '2rem', marginBottom: '0.5rem' }}>{selectedEntry.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</h1>
                    <div className="menu-separator" style={{ width: '100%', marginBottom: '1.5rem', opacity: 0.3 }}></div>
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                       <div className="skyrim-font" style={{ color: '#c00' }}>HEALTH: {selectedEntry.mood}/10</div>
                       <div className="skyrim-font" style={{ color: '#008' }}>MAGICKA: {selectedEntry.sleep}/10</div>
                       <div className="skyrim-font" style={{ color: '#080' }}>STAMINA: {selectedEntry.energy}/10</div>
                    </div>
                    <div className="quest-category-title" style={{ fontSize: '0.7rem' }}>Daily Triumphs</div>
                    <ul className="skyrim-serif" style={{ fontSize: '1.3rem', lineHeight: '1.8', listStyleType: 'square', color: '#bbb' }}>
                      {selectedEntry.highlights?.filter(h => h).map((h, i) => <li key={i}>{h}</li>)}
                      {(!selectedEntry.highlights || selectedEntry.highlights.every(h => !h)) && <li>No triumphs recorded for this day.</li>}
                    </ul>
                  </>
                ) : <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.3 }}><p className="skyrim-serif" style={{ fontSize: '1.5rem' }}>No chronicles found</p></div>}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#555' }} className="skyrim-font">
          [ CLICK BACKGROUND TO CLOSE SYSTEM MENU ]
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;
