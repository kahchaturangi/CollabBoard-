import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Search,
  AlertCircle,
  UserCheck,
  Clock,
  Check,
  Sparkles,
  Inbox,
} from 'lucide-react';

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onRemoveNotif,
  onClearAll,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'task' | 'member' | 'mention'
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((n) => {
    // Search query filter
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'task') return n.type === 'task';
    if (activeTab === 'member') return n.type === 'member';
    if (activeTab === 'mention') return n.type === 'mention' || n.type === 'update';
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container notif-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="notif-modal-title-group">
            <div className="notif-modal-icon-badge">
              <Bell size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title">All Notifications</h3>
                {unreadCount > 0 && (
                  <span className="notif-count-pill">{unreadCount} Unread</span>
                )}
              </div>
              <p className="modal-subtitle">
                Stay updated with tasks, team activities, and workspace events.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-notif-action"
                onClick={onMarkAllRead}
                title="Mark all notifications as read"
              >
                <CheckCheck size={15} />
                <span>Mark All Read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn-notif-action btn-notif-danger"
                onClick={onClearAll}
                title="Clear all notifications"
              >
                <Trash2 size={15} />
                <span>Clear All</span>
              </button>
            )}
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="Close Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="notif-modal-controls">
          <div className="notif-modal-search">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="notif-modal-tabs">
            <button
              type="button"
              className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              className={`notif-tab ${activeTab === 'task' ? 'active' : ''}`}
              onClick={() => setActiveTab('task')}
            >
              Tasks
            </button>
            <button
              type="button"
              className={`notif-tab ${activeTab === 'member' ? 'active' : ''}`}
              onClick={() => setActiveTab('member')}
            >
              Team
            </button>
            <button
              type="button"
              className={`notif-tab ${activeTab === 'mention' ? 'active' : ''}`}
              onClick={() => setActiveTab('mention')}
            >
              Mentions & Updates
            </button>
          </div>
        </div>

        {/* Notifications Body */}
        <div className="notif-modal-body">
          {filteredNotifs.length === 0 ? (
            <div className="notif-modal-empty">
              <div className="notif-empty-icon-wrap">
                <Inbox size={40} strokeWidth={1.5} />
              </div>
              <h4>No notifications found</h4>
              <p>
                {searchQuery || activeTab !== 'all'
                  ? 'Try adjusting your search or switching filter tabs.'
                  : "You're all caught up! There are no notifications right now."}
              </p>
            </div>
          ) : (
            <div className="notif-modal-list">
              {filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`notif-modal-item ${n.read ? 'is-read' : 'is-unread'}`}
                  onClick={() => onMarkRead(n.id)}
                >
                  <div className={`notif-icon-wrap notif-icon-${n.type}`}>
                    {n.icon === 'alert' && <AlertCircle size={18} />}
                    {n.icon === 'user' && <UserCheck size={18} />}
                    {n.icon === 'clock' && <Clock size={18} />}
                    {n.icon === 'check' && <CheckCheck size={18} />}
                  </div>

                  <div className="notif-modal-item-content">
                    <div className="notif-modal-item-header">
                      <h4 className="notif-modal-item-title">{n.title}</h4>
                      <span className="notif-modal-item-time">{n.time}</span>
                    </div>
                    <p className="notif-modal-item-body">{n.body}</p>
                  </div>

                  <div className="notif-modal-item-actions" onClick={(e) => e.stopPropagation()}>
                    {!n.read && (
                      <button
                        type="button"
                        className="btn-item-action"
                        onClick={() => onMarkRead(n.id)}
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-item-action btn-item-delete"
                      onClick={() => onRemoveNotif(n.id)}
                      title="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer notif-modal-footer">
          <span className="notif-footer-text">
            Showing {filteredNotifs.length} of {notifications.length} notifications
          </span>
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
