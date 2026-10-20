import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { describeAuthError, useAuth } from '../../context/AuthContext';
import AuthLayout, { Divider, GoogleButton } from './AuthLayout';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    setLoading(true);
    try { await fn(); navigate('/dashboard'); }
    catch (err) { setError(describeAuthError(err)); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Return to Skyrim" error={error}>
      <form onSubmit={e => { e.preventDefault(); void run(() => signIn(email.trim(), password)); }}>
        <div className="input-group">
          <label className="skyrim-font field-label" htmlFor="si-email"><span>EMAIL</span></label>
          <input id="si-email" type="email" autoComplete="email" className="parchment-input dark" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label className="skyrim-font field-label" htmlFor="si-pass"><span>PASSWORD</span></label>
          <input id="si-pass" type="password" autoComplete="current-password" className="parchment-input dark" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button disabled={loading} className="btn-primary wide skyrim-font" type="submit">{loading ? 'OPENING THE GATE...' : 'ENTER REALM'}</button>
      </form>
      <Divider />
      <GoogleButton onClick={() => void run(signInWithGoogle)} disabled={loading} label="Sign in with Google" />
      <div className="auth-footer skyrim-serif">
        <Link to="/forgot-password">Lost your key?</Link>
        <p>New to the realm? <Link to="/signup">Create a character</Link></p>
      </div>
    </AuthLayout>
  );
};

export default SignIn;
