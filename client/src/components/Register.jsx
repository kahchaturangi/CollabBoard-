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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0c10', fontFamily: 'Inter, sans-serif', padding: '20px 0' }}>
      
      {/* Brand Logo Above Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #5c5cfc', borderRadius: '10px', backgroundColor: 'transparent' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="9" width="3" height="10" rx="1" fill="#5c5cfc" />
            <rect x="11" y="5" width="3" height="14" rx="1" fill="#5c5cfc" />
            <rect x="17" y="11" width="3" height="8" rx="1" fill="#5c5cfc" />
          </svg>
        </div>
        <h1 style={{ color: '#ffffff', fontSize: '24px', margin: 0, fontWeight: '700' }}>CollabBoard</h1>
      </div>

      <div style={{ backgroundColor: '#14171d', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '440px', border: '1px solid #1f232b', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>Create Account</h2>
          <p style={{ color: '#8a919e', margin: 0, fontSize: '15px' }}>Register to join your team.</p>
        </div>
        
        <form onSubmit={handleRegister}>
          {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
          
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8a919e', display: 'flex' }}>
              <Type size={18} />
            </div>
            <input
              type="text"
              placeholder="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '10px', border: '1px solid #262933', backgroundColor: '#1c2028', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8a919e', display: 'flex' }}>
              <User size={18} />
            </div>
            <input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '10px', border: '1px solid #262933', backgroundColor: '#1c2028', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8a919e', display: 'flex' }}>
              <Mail size={18} />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '10px', border: '1px solid #262933', backgroundColor: '#1c2028', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8a919e', display: 'flex' }}>
              <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '10px', border: '1px solid #262933', backgroundColor: '#1c2028', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8a919e', display: 'flex' }}>
              <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '10px', border: '1px solid #262933', backgroundColor: '#1c2028', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', backgroundColor: loading ? '#3e3eab' : '#5c5cfc', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#4b4be3')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5c5cfc')}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0 24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#262933' }}></div>
          <span style={{ color: '#5b616e', padding: '0 16px', fontSize: '14px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#262933' }}></div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#8a919e', fontSize: '13px', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            Already have an account? Log in to access your workspace.
          </p>
          <Link to="/login" style={{ color: '#5c5cfc', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            Login to CollabBoard
          </Link>
        </div>

      </div>
    </div>
  );
}
