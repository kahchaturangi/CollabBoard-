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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Brand Logo Above Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)' }}>
          <LayoutGrid size={22} color="#ffffff" />
        </div>
        <h1 style={{ color: '#0f172a', fontSize: '26px', margin: 0, fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>CollabBoard</h1>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '440px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>Welcome Back!</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>Please log in to your account.</p>
        </div>
        
        <form onSubmit={handleLogin}>
          {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
          
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
              <User size={18} />
            </div>
            <input
              type="email"
              placeholder="Username / Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 44px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
              <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 44px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: '10px', width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>Remember me</label>
            </div>
            <a href="#" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px', boxShadow: '0 4px 14px rgba(79,70,229,0.35)', transition: 'all 0.2s' }}
          >
            {loading ? 'Logging in...' : 'Login to CollabBoard'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0 20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
          <span style={{ color: '#94a3b8', padding: '0 16px', fontSize: '14px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            New member? Invite will be sent via your team admin (Niro).
          </p>
          <Link to="/register" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            Create an Account
          </Link>
        </div>

      </div>
    </div>

  );
}
