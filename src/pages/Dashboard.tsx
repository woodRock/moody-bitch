// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
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
import '../styles/Dashboard.css';

interface MoodEntry {
  id: string;
  mood: number;
  energy: number;
  sleep: number;
  notes: string;
  timestamp: Timestamp;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        console.log("Fetching data for user:", currentUser.uid);
        // Fetch all entries for the user without orderBy to avoid index issues initially
        const q = query(
          collection(db, 'moodEntries'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        console.log("Documents found:", querySnapshot.size);
        
        const fetchedEntries: MoodEntry[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MoodEntry[];

        // Sort by timestamp ascending in JS
        fetchedEntries.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

        console.log("Entries set to state:", fetchedEntries);
        setEntries(fetchedEntries);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Prepare data for the chart (format dates)
  const chartData = entries.map((entry) => ({
    date: entry.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: entry.mood,
    energy: entry.energy,
    sleep: entry.sleep,
  }));

  // Get recent entries (reverse the list and take top 5)
  const recentEntries = [...entries].reverse().slice(0, 5);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome, {currentUser?.email}</h1>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="section-title">Quick Actions</h2>
          <ul className="quick-actions-list">
            <li>
              <Link
                to="/checkin"
                className="btn btn-primary w-full"
                style={{ textDecoration: 'none' }}
              >
                New Daily Check-in
              </Link>
            </li>
            <li>
              <Link
                to="/journal"
                className="btn btn-secondary w-full"
                style={{ textDecoration: 'none' }}
              >
                View Journal Entries
              </Link>
            </li>
          </ul>
        </div>

        {/* Charts */}
        <div className="card col-span-2">
          <h2 className="section-title">Mood & Energy Trends</h2>
          <div style={{ width: '100%', height: 300 }}>
            {loading ? (
              <p className="text-muted text-center">Loading chart data...</p>
            ) : entries.length === 0 ? (
              <p className="text-muted text-center">No data yet. Add a check-in to see trends!</p>
            ) : (
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="mood" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Mood" />
                  <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Energy" />
                  <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Sleep (hrs)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Entries Preview */}
        <div className="card">
          <h2 className="section-title">Recent Entries</h2>
          {loading ? (
             <p className="text-muted text-center">Loading...</p>
          ) : recentEntries.length === 0 ? (
            <div className="placeholder-chart" style={{ height: '12rem', border: 'none' }}>
              <p>No recent entries.</p>
            </div>
          ) : (
            <ul className="quick-actions-list">
              {recentEntries.map((entry) => (
                <li key={entry.id} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600 }}>
                    <span>{entry.timestamp.toDate().toLocaleDateString()}</span>
                    <span style={{ color: '#3b82f6' }}>Mood: {entry.mood}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.notes || 'No notes.'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
