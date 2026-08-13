import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import '../index.css'; 

export default function Register({ setAuth }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await apiService.register(username, email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email }));
      setAuth(true);
      navigate('/board');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
      <div className="login-card" style={{ backgroundColor: 'var(--bg-secondary)', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="7" y="9" width="2" height="8" rx="1" fill="#6366f1"/>
                <rect x="11" y="11" width="2" height="4" rx="1" fill="#6366f1"/>
                <rect x="15" y="7" width="2" height="12" rx="1" fill="#6366f1"/>
            </svg>
          </div>
          <h1 style={{ color: 'var(--text-main)', fontSize: '24px', margin: 0 }}>CollabBoard</h1>
        </div>
        
        <div className="welcome-text" style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--text-main)', margin: '0 0 8px 0' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Register to join your team.</p>
        </div>

        <form onSubmit={handleRegister}>
          {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
          
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Username" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <input 
              type="email" 
              placeholder="Email Address" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
            />
          </div>

          <button type="submit" className="save-btn" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            Register
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
             <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px' }}>Already have an account? Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
