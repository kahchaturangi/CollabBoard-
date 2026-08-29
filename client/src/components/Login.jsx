import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { User, Lock, LayoutGrid, ArrowRight } from 'lucide-react';
import DayNightGreeting from './DayNightGreeting';
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
    <div className="auth-page-wrapper">
      <div className="auth-dual-container">
        
        {/* Animated Day/Night Greeting Left Panel */}
        <DayNightGreeting />

        {/* Login Form Right Panel */}
        <div className="auth-form-card">
          <div className="auth-brand-header">
            <div className="auth-logo-icon">
              <LayoutGrid size={22} color="#ffffff" />
            </div>
            <h2>CollabBoard</h2>
          </div>

          <div className="auth-title-section">
            <h3>Account Sign In</h3>
            <p>Welcome back! Please enter your details.</p>
          </div>
          
          <form onSubmit={handleLogin}>
            {error && (
              <div className="auth-error-banner">
                {error}
              </div>
            )}
            
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Username or Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="auth-actions-row">
              <label className="auth-remember-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="auth-custom-box"></span>
                Remember me
              </label>
              <a href="#" className="auth-link">Forgot Password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              <span>{loading ? 'Signing in...' : 'Sign In to CollabBoard'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer-nav">
            <p>New to CollabBoard?</p>
            <Link to="/register" className="auth-signup-link">
              Create an Account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
