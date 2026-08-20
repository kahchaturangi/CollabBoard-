import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { User, Lock, Mail, Type } from 'lucide-react';
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
      // Backend does not accept fullName currently according to previous checks, 
      // but it does accept username, email, password. We'll just ignore fullName for the API.
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
          <h2>Create Account</h2>
          <p>Register to join your team.</p>
        </div>
        
        <form onSubmit={handleRegister}>
          {error && <div className="auth-error">{error}</div>}
          
          <div className="auth-field">
            <div className="auth-field-icon">
              <Type size={18} />
            </div>
            <input
              type="text"
              placeholder="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-icon">
              <User size={18} />
            </div>
            <input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-icon">
              <Mail size={18} />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-field">
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

          <div className="auth-field auth-field-password">
            <div className="auth-field-icon">
              <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-divider">
          <div></div>
          <span>or</span>
          <div></div>
        </div>

        <div className="auth-footer">
          <p>
            Already have an account? Log in to access your workspace.
          </p>
          <Link to="/login" className="auth-link">
            Login to CollabBoard
          </Link>
        </div>

      </div>
    </div>
  );
}
