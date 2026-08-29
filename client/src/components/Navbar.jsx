import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Plus, Bell, Sun, Moon, Users, User, LogOut, Sparkles, CheckCheck, X, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import sunImg from '../assets/sun.png';
import moonCloudImg from '../assets/moon-cloud.png';
import NotificationsModal from './NotificationsModal';

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
  const [isAllNotifModalOpen, setIsAllNotifModalOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'task',    icon: 'alert',    title: 'New task assigned',      body: 'You have been assigned "Fix login bug" by Niro.',    time: '2m ago',  read: false },
    { id: 2, type: 'member',  icon: 'user',     title: 'Team member joined',     body: 'Sahan Perera joined the CollabBoard workspace.',        time: '18m ago', read: false },
    { id: 3, type: 'update',  icon: 'clock',    title: 'Task status updated',    body: '"Design Homepage" moved to In Review by Amaya.',        time: '1h ago',  read: false },
    { id: 4, type: 'mention', icon: 'check',    title: 'You were mentioned',      body: 'Kavya mentioned you in a comment on "API Integration".', time: '3h ago',  read: true  },
    { id: 5, type: 'task',    icon: 'alert',    title: 'Deadline approaching',   body: '"Database Schema" is due tomorrow at 5:00 PM.',          time: '5h ago',  read: true  },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const removeNotif = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const clearAllNotifs = () => setNotifications([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isUserMenuOpen || isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isNotifOpen]);

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

  // Time-based greeting calculation
  const currentHour = new Date().getHours();
  const isDayTime = currentHour >= 5 && currentHour < 19;
  const greetingPhrase = isDayTime 
    ? (currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening')
    : 'Good Night';

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

      {/* Dynamic Animated Greeting Badge in Navbar */}
      <div className="nav-time-greeting-badge" title={`Time Greeting: ${greetingPhrase}`}>
        <div className="nav-greeting-avatar-wrap">
          <img 
            src={isDayTime ? sunImg : moonCloudImg} 
            alt={isDayTime ? 'Sun' : 'Moon'} 
            className={`nav-greeting-icon ${isDayTime ? 'nav-sun-bob' : 'nav-moon-sway'}`} 
          />
        </div>
        <div className="nav-greeting-text">
          <span className="nav-greeting-label">{greetingPhrase},</span>
          <span className="nav-greeting-name">{activeUser.name || 'Team'}</span>
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

        {/* Notification Bell Dropdown */}
        <div className="notif-bell-wrapper" ref={notifRef}>
          <button
            type="button"
            className={`nav-icon-btn bell-btn${unreadCount > 0 ? ' bell-has-unread' : ''}`}
            title="Notifications"
            onClick={() => setIsNotifOpen((p) => !p)}
          >
            <Bell size={20} className={unreadCount > 0 ? 'bell-ring-anim' : ''} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {isNotifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-header-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead} title="Mark all as read">
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={32} strokeWidth={1.5} />
                    <p>You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item${n.read ? ' notif-read' : ''}`}
                      onClick={() => markRead(n.id)}
                    >
                      <div className={`notif-icon-wrap notif-icon-${n.type}`}>
                        {n.icon === 'alert'  && <AlertCircle size={15} />}
                        {n.icon === 'user'   && <UserCheck   size={15} />}
                        {n.icon === 'clock'  && <Clock       size={15} />}
                        {n.icon === 'check'  && <CheckCheck  size={15} />}
                      </div>
                      <div className="notif-content">
                        <p className="notif-title">{n.title}</p>
                        <p className="notif-body">{n.body}</p>
                        <span className="notif-time">{n.time}</span>
                      </div>
                      {!n.read && <span className="notif-unread-dot" />}
                      <button
                        className="notif-dismiss"
                        onClick={(e) => { e.stopPropagation(); removeNotif(n.id); }}
                        title="Dismiss"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="notif-footer">
                  <button
                    type="button"
                    className="notif-view-all"
                    onClick={() => {
                      setIsNotifOpen(false);
                      setIsAllNotifModalOpen(true);
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          className={`nav-icon-btn theme-toggle-btn ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun size={19} className="theme-icon sun-icon" />
          ) : (
            <Moon size={19} className="theme-icon moon-icon" />
          )}
        </button>

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

      {/* Full Notifications Modal */}
      <NotificationsModal
        isOpen={isAllNotifModalOpen}
        onClose={() => setIsAllNotifModalOpen(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onRemoveNotif={removeNotif}
        onClearAll={clearAllNotifs}
      />
    </header>
  );
}
