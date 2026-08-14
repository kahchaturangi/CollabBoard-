import React from 'react';
import { LayoutGrid, Plus, Sparkles, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onOpenAddModal, totalTasksCount, setIsAuthenticated, setBoardId }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    localStorage.removeItem('boardId');
    sessionStorage.removeItem('boardId');
    if (setIsAuthenticated) setIsAuthenticated(false);
    if (setBoardId) setBoardId(null);
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-logo">
          <LayoutGrid size={20} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">CollabBoard</h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-add-task" onClick={onOpenAddModal}>
          <Plus size={18} />
          New Task
        </button>
        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </header>
  );
}
