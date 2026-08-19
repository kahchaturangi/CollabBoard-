import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { User, Lock, LayoutGrid } from 'lucide-react';
import '../index.css';

export default function Login({ setIsAuthenticated, setBoardId }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      navigate('/dashboard');
    }
  }, [setIsAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiService.login(email, password);
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email }));
        if (data.boardId) localStorage.setItem('boardId', data.boardId);
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email }));
        if (data.boardId) sessionStorage.setItem('boardId', data.boardId);
      }
      setIsAuthenticated(true);
      if (setBoardId && data.boardId) setBoardId(data.boardId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      
      {/* Brand Logo Above Card */}
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="9" width="3" height="10" rx="1" fill="#5c5cfc" />
            <rect x="11" y="5" width="3" height="14" rx="1" fill="#5c5cfc" />
            <rect x="17" y="11" width="3" height="8" rx="1" fill="#5c5cfc" />
          </svg>
        </div>
        <h1>CollabBoard</h1>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back!</h2>
          <p>Please log in to your account.</p>
        </div>
        
        <form onSubmit={handleLogin}>
          {error && <div className="auth-error">{error}</div>}
          
          <div className="auth-field">
            <div className="auth-field-icon">
              <User size={18} />
            </div>
            <input
              type="email"
              placeholder="Username / Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-field auth-field-password">
            <div className="auth-field-icon">
              <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-options">
            <div className="remember-option">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="remember-checkbox"
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <a href="#" className="auth-link">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit"
          >
            {loading ? 'Logging in...' : 'Login to CollabBoard'}
          </button>
        </form>

        <div className="auth-divider">
          <div></div>
          <span>or</span>
          <div></div>
        </div>

        <div className="auth-footer">
          <p>
            New member? Invite will be sent via your team admin (Niro). For Git Repo access, please use the provided credentials.
          </p>
          <p style={{ color: '#8a919e', fontSize: '13px', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            If you are the team leader (Niro), ensure you create the initial account and add your members in the admin panel later.
          </p>
          <Link to="/register" className="auth-link">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
}
