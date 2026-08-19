import React, { useState } from 'react';
import { ChevronDown, LayoutGrid, LogOut, Plus, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onOpenAddModal, onOpenMemberModal, totalTasksCount, setIsAuthenticated, setBoardId }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  let user = {};
  try {
    user = storedUser ? JSON.parse(storedUser) : {};
  } catch {
    user = {};
  }
  const displayName = user.username || 'Workspace member';
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
          <p className="navbar-greeting">Hi, {firstName}</p>
        </div>
      </div>

      <div className="navbar-actions">
        <button className="btn-add-task" onClick={onOpenAddModal}>
          <Plus size={18} />
          New Task
        </button>
        <button className="btn-member" onClick={onOpenMemberModal} title="Add member">
          <UserPlus size={17} />
          <span>Add member</span>
        </button>
        <div className="profile-menu-wrap">
          <button
            className="profile-trigger"
            onClick={() => setIsProfileOpen((open) => !open)}
            aria-expanded={isProfileOpen}
            aria-label="Open user profile menu"
          >
            <span className="profile-avatar">{initials}</span>
            <span className="profile-trigger-text">
              <strong>{displayName}</strong>
              <small>{user.email || 'Signed-in user'}</small>
            </span>
            <ChevronDown size={16} className={isProfileOpen ? 'profile-chevron open' : 'profile-chevron'} />
          </button>
          {isProfileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-heading">
                <span className="profile-avatar profile-avatar-large">{initials}</span>
                <div>
                  <strong>{displayName}</strong>
                  <small>{user.email || 'Signed-in user'}</small>
                </div>
              </div>
              <button className="profile-logout" onClick={handleLogout}>
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
