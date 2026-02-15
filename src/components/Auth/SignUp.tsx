import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    try {
      setError('');
      setLoading(true);
      await signUp(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create an account.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">NEW RECRUIT</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="input-group">
            <label className="skyrim-font" style={{ fontSize: '0.8rem', color: '#888' }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="parchment-input"
              required
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #444' }}
            />
          </div>
          <div className="input-group">
            <label className="skyrim-font" style={{ fontSize: '0.8rem', color: '#888' }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="parchment-input"
              required
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #444' }}
            />
          </div>
          <div className="input-group">
            <label className="skyrim-font" style={{ fontSize: '0.8rem', color: '#888' }}>CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="parchment-input"
              required
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #444' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid var(--skyrim-gold-dim)' }}
          >
            {loading ? 'SCRIBING NAME...' : 'ENLIST'}
          </button>
        </form>
        <div className="auth-footer">
          Already a citizen? <Link to="/signin">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
