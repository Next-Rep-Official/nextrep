import React, { useState } from 'react';
import { login } from '../api/endpoints';
import { setToken } from '../api/auth';
import { ApiError } from '../api/client';

interface LoginProps {
  onLogin: () => void;
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup }) => {
  const [key, setKey] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(key, password);
      if (response.body.data?.token) {
        setToken(response.body.data.token);
        onLogin();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Nextrep</h1>
        <h2>Welcome back</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <input
              type="text"
              placeholder="Username or Email"
              value={key}
              onChange={(e) => setKey(e.target.value)}
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
                Logging in...
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>
        <p className="auth-switch">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignup} className="link-button">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
