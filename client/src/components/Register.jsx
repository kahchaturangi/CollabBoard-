import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { User, Lock, Mail, Type, LayoutGrid, ArrowRight } from 'lucide-react';
import DayNightGreeting from './DayNightGreeting';
import '../index.css';

export default function Register({ setIsAuthenticated, setBoardId }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiService.register(username, email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email }));
      if (data.boardId) localStorage.setItem('boardId', data.boardId);
      setIsAuthenticated(true);
      if (setBoardId && data.boardId) setBoardId(data.boardId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-dual-container">
        
        {/* Animated Day/Night Greeting Left Panel */}
        <DayNightGreeting />

        {/* Register Form Right Panel */}
        <div className="auth-form-card">
          <div className="auth-brand-header">
            <div className="auth-logo-icon">
              <LayoutGrid size={22} color="#ffffff" />
            </div>
            <h2>CollabBoard</h2>
          </div>

          <div className="auth-title-section">
            <h3>Create Account</h3>
            <p>Join your workspace and start collaborating today.</p>
          </div>

          <form onSubmit={handleRegister}>
            {error && (
              <div className="auth-error-banner">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Type size={18} />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Username */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            {/* Email */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Password (min. 8 characters)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* Confirm Password */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Confirm Password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer-nav">
            <p>Already have an account?</p>
            <Link to="/login" className="auth-signup-link">
              Sign In to CollabBoard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
