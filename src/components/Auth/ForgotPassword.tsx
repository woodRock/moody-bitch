import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email.trim());
    } catch (err) {
      // Deliberately the same message whether or not the account exists.
      console.warn('Password reset request failed', (err as { code?: string })?.code);
    } finally {
      setMessage('If a character answers to that address, a courier has been dispatched with instructions.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Restore Memory" message={message}>
      <form onSubmit={submit}>
        <div className="input-group">
          <label className="skyrim-font field-label" htmlFor="fp-email"><span>EMAIL</span></label>
          <input id="fp-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="parchment-input dark" required />
        </div>
        <button type="submit" className="btn-primary wide skyrim-font" disabled={loading}>{loading ? 'SENDING COURIER...' : 'RESET PASSWORD'}</button>
      </form>
      <div className="auth-footer skyrim-serif"><Link to="/signin">Back to the gate</Link></div>
    </AuthLayout>
  );
};

export default ForgotPassword;
