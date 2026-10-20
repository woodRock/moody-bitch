import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { describeAuthError, useAuth } from '../../context/AuthContext';
import AuthLayout, { Divider, GoogleButton } from './AuthLayout';

const MIN_PASSWORD = 8;

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    setLoading(true);
    try { await fn(); navigate('/today'); }
    catch (err) { setError(describeAuthError(err)); }
    finally { setLoading(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(`Your pass-phrase must be at least ${MIN_PASSWORD} characters.`);
    if (password !== passwordConfirm) return setError('The two pass-phrases do not match.');
    void run(() => signUp(email.trim(), password));
  };

  return (
    <AuthLayout title="New Character" error={error}>
      <form onSubmit={submit}>
        <div className="input-group">
          <label className="skyrim-font field-label" htmlFor="su-email"><span>EMAIL</span></label>
          <input id="su-email" type="email" autoComplete="email" className="parchment-input dark" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label className="skyrim-font field-label" htmlFor="su-pass"><span>PASSWORD</span><span className="field-value">{MIN_PASSWORD}+ characters</span></label>
          <input id="su-pass" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} className="parchment-input dark" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div className="input-group">
          <label className="skyrim-font field-label" htmlFor="su-pass2"><span>CONFIRM PASSWORD</span></label>
          <input id="su-pass2" type="password" autoComplete="new-password" className="parchment-input dark" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required />
        </div>
        <button disabled={loading} className="btn-primary wide skyrim-font" type="submit">{loading ? 'FORGING...' : 'FORGE IDENTITY'}</button>
      </form>
      <Divider />
      <GoogleButton onClick={() => void run(signInWithGoogle)} disabled={loading} label="Sign up with Google" />
      <div className="auth-footer skyrim-serif">
        <p>Already have a character? <Link to="/signin">Return to Realm</Link></p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
