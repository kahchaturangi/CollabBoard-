import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Plus, Bell, Sun, Users, User, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({
  onOpenAddModal,
  onOpenMembersModal,
  members = [],
  currentUser,
  setIsAuthenticated,
  setBoardId,
}) {
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

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

  const activeUser = currentUser || members[0] || {
    name: 'Niro',
    role: 'Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };

  return (
    <header className="navbar">
      <div className="brand-section" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo">
          <LayoutGrid size={22} color="#ffffff" />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">CollabBoard</h1>
          <p className="brand-subtitle">Stay organized. Work together.</p>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Team Members Avatar Stack & Modal Trigger */}
        <div className="navbar-team-group">
          <div
            className="team-avatars-stack"
            onClick={onOpenMembersModal}
            title="View & Manage Team Members"
          >
            {members.slice(0, 3).map((m, idx) => (
              <img
                key={m.id || idx}
                src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                alt={m.name}
                className="team-stack-avatar"
                style={{ zIndex: 10 - idx }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
                }}
              />
            ))}
            {members.length > 3 && (
              <div className="team-stack-more" style={{ zIndex: 6 }}>
                +{members.length - 3}
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-nav-team"
            onClick={onOpenMembersModal}
            title="Manage Team Members"
          >
            <Users size={15} />
            <span>Team ({members.length})</span>
          </button>
        </div>

        {/* Profile Page Quick Button */}
        <button
          type="button"
          className="btn-nav-profile-link"
          onClick={() => navigate('/profile')}
          title="Group Profiles & Member Directory"
        >
          <Sparkles size={15} />
          <span>Profiles</span>
        </button>

        {onOpenAddModal && (
          <button className="btn-add-task" onClick={onOpenAddModal}>
            <Plus size={18} strokeWidth={2.5} />
            <span>New Task</span>
          </button>
        )}

        <div className="nav-icon-btn bell-btn" title="Notifications">
          <Bell size={19} />
          <span className="notification-badge">3</span>
        </div>

        <div className="nav-icon-btn" title="Toggle Theme">
          <Sun size={19} />
        </div>

        {/* User Avatar & Dropdown Menu */}
        <div className="user-menu-wrapper" ref={userMenuRef}>
          <div
            className="user-avatar-wrapper"
            title="Account Menu"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
          >
            <img
              src={activeUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={activeUser.name}
              className="user-avatar-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="user-avatar-fallback" style={{ display: 'none' }}>
              {activeUser.name?.substring(0, 2).toUpperCase() || 'AR'}
            </div>
          </div>

          {isUserMenuOpen && (
            <div className="user-dropdown-popover">
              <div className="user-popover-header">
                <span className="popover-user-name">{activeUser.name}</span>
                <span className="popover-user-role">{activeUser.designation || activeUser.role || 'Member'}</span>
              </div>
              <div className="user-popover-divider" />
              <button
                type="button"
                className="user-popover-item"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/profile');
                }}
              >
                <User size={15} />
                <span>Team Profile Page</span>
              </button>
              <button
                type="button"
                className="user-popover-item logout-item"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}



