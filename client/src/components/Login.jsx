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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Brand Logo Above Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #0066ff', borderRadius: '10px', background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="9" width="3" height="10" rx="1" fill="#ffffff" />
            <rect x="11" y="5" width="3" height="14" rx="1" fill="#ffffff" />
            <rect x="17" y="11" width="3" height="8" rx="1" fill="#ffffff" />
          </svg>
        </div>
        <h1 style={{ color: '#1a1a1a', fontSize: '24px', margin: 0, fontWeight: '700' }}>CollabBoard</h1>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '440px', border: '1px solid #dce3ed', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ color: '#1a1a1a', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>Welcome Back!</h2>
          <p style={{ color: '#666666', margin: 0, fontSize: '15px' }}>Please log in to your account.</p>
        </div>
        
        <form onSubmit={handleLogin}>
          {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
          
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#999999', display: 'flex' }}>
              <User size={18} />
            </div>
            <input
              type="email"
              placeholder="Username / Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '10px', border: '1px solid #dce3ed', backgroundColor: '#f0f4f8', color: '#1a1a1a', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#999999', display: 'flex' }}>
              <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '10px', border: '1px solid #dce3ed', backgroundColor: '#f0f4f8', color: '#1a1a1a', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: '10px', width: '16px', height: '16px', accentColor: '#0066ff', cursor: 'pointer', backgroundColor: '#f0f4f8', border: '1px solid #dce3ed' }}
              />
              <label htmlFor="rememberMe" style={{ color: '#666666', fontSize: '14px', cursor: 'pointer' }}>Remember me</label>
            </div>
            <a href="#" style={{ color: '#0066ff', textDecoration: 'none', fontSize: '14px' }}>Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', backgroundColor: loading ? '#0052cc' : '#0066ff', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0052cc')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0066ff')}
          >
            {loading ? 'Logging in...' : 'Login to CollabBoard'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0 24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#dce3ed' }}></div>
          <span style={{ color: '#999999', padding: '0 16px', fontSize: '14px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#dce3ed' }}></div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#666666', fontSize: '13px', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            New member? Invite will be sent via your team admin (Niro). For Git Repo access, please use the provided credentials.
          </p>
          <p style={{ color: '#666666', fontSize: '13px', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            If you are the team leader (Niro), ensure you create the initial account and add your members in the admin panel later.
          </p>
          <Link to="/register" style={{ color: '#0066ff', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
}
