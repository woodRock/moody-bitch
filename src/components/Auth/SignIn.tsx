import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/Auth.css';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to log in. Check your credentials.');
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign in with Google.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card parchment-bg">
        <h2 className="skyrim-font auth-title">Return to Skyrim</h2>
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
          <button disabled={loading} className="btn-auth skyrim-font" type="submit">
            Enter Realm
          </button>
        </form>

        <div className="divider-container">
          <div className="menu-separator"></div>
          <span className="skyrim-serif divider-text">OR</span>
          <div className="menu-separator"></div>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading} 
          className="btn-google skyrim-font"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="google-icon" />
          Sign in with Google
        </button>

        <div className="auth-footer skyrim-serif">
          <Link to="/forgot-password">Lost your key?</Link>
          <p>New to the realm? <Link to="/signup">Create a character</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
