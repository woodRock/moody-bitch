import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your inbox for further instructions.');
    } catch (err) {
      setError('Failed to reset password.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">RESTORE MEMORY</h2>
        {error && <div className="error-message">{error}</div>}
        {message && <div style={{ color: '#10b981', textAlign: 'center', marginBottom: '1rem', fontFamily: 'Crimson Text' }}>{message}</div>}
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
          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid var(--skyrim-gold-dim)' }}
          >
            {loading ? 'SENDING MESSENGER...' : 'RESET PASSWORD'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/signin">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
