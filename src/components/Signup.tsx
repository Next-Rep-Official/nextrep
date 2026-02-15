import React, { useState } from 'react';
import { signUp } from '../api/endpoints';
import { setToken } from '../api/auth';
import { ApiError } from '../api/client';

interface SignupProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
  onBack?: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await signUp(username, email, password);
      if (response.body.data?.token) {
        setToken(response.body.data.token);
        onSignup();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="auth-back-button"
            aria-label="Go back"
          >
            ← Back
          </button>
        )}
        <h1>Nextrep</h1>
        <h2>Create your account</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner loading-spinner-small" style={{ marginRight: '8px', display: 'inline-block' }}></span>
                Creating account...
              </>
            ) : (
              'Sign up'
            )}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="link-button">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
