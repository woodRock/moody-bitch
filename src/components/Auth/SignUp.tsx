import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/Auth.css';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
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

  async function handleGoogleSignUp() {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign up with Google.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card parchment-bg">
        <h2 className="skyrim-font auth-title">New Character</h2>
        {error && <div className="error-banner skyrim-serif">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="skyrim-font label-text">Email</label>
            <input 
              type="email" 
              className="parchment-input" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label className="skyrim-font label-text">Password</label>
            <input 
              type="password" 
              className="parchment-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label className="skyrim-font label-text">Confirm Password</label>
            <input 
              type="password" 
              className="parchment-input" 
              value={passwordConfirm} 
              onChange={(e) => setPasswordConfirm(e.target.value)} 
              required 
            />
          </div>
          <button disabled={loading} className="btn-auth skyrim-font" type="submit">
            Forge Identity
          </button>
        </form>

        <div className="divider-container">
          <div className="menu-separator"></div>
          <span className="skyrim-serif divider-text">OR</span>
          <div className="menu-separator"></div>
        </div>

        <button 
          onClick={handleGoogleSignUp} 
          disabled={loading} 
          className="btn-google skyrim-font"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="google-icon" />
          Sign up with Google
        </button>

        <div className="auth-footer skyrim-serif">
          <p>Already have a character? <Link to="/signin">Return to Realm</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
