import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  Mail,
  Shield,
  Trash2,
  Copy,
  Check,
  Search,
  Crown,
  UserCheck,
} from 'lucide-react';

export default function MembersModal({ isOpen, onClose, members = [], onAddMember, onRemoveMember, onUpdateRole }) {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Member');
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  if (!isOpen) return null;

  const handleInvite = (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    const emailTrimmed = newEmail.trim();
    if (!emailTrimmed) {
      setInviteError('Please enter an email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setInviteError('Please enter a valid email address (e.g. alex@company.com).');
      return;
    }

    const emailLower = emailTrimmed.toLowerCase();
    if (members.some((m) => m && m.email && m.email.toLowerCase() === emailLower)) {
      setInviteError('A member with this email is already in the workspace.');
      return;
    }

    const name = newName.trim() || emailTrimmed.split('@')[0];
    const newMember = {
      id: `mem-${Date.now()}`,
      name: name,
      email: emailLower,
      role: newRole,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      online: true,
    };

    if (onAddMember) onAddMember(newMember);
    setNewEmail('');
    setNewName('');
    setNewRole('Member');
    setInviteSuccess(`🎉 ${name} (${emailLower}) has been invited as ${newRole}!`);
    setTimeout(() => setInviteSuccess(''), 4000);
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/register?board=collab-workspace`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredMembers = members.filter((m) => {
    if (!m) return false;
    const q = (searchFilter || '').toLowerCase().trim();
    if (!q) return true;
    const nameMatch = m.name ? m.name.toLowerCase().includes(q) : false;
    const emailMatch = m.email ? m.email.toLowerCase().includes(q) : false;
    const roleMatch = m.role ? m.role.toLowerCase().includes(q) : false;
    return nameMatch || emailMatch || roleMatch;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="members-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-icon">
            <Users size={22} />
          </div>
          <div className="modal-header-text">
            <h2 className="modal-title">Team Members & Permissions</h2>
            <p className="modal-subtitle">Collaborate in real-time with your team</p>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Invite Member Form */}
        <div className="members-invite-box">
          <h3 className="members-section-title">
            <UserPlus size={15} /> Invite New Member
          </h3>

          {inviteError && (
            <div className="invite-alert error">
              {inviteError}
            </div>
          )}

          {inviteSuccess && (
            <div className="invite-alert success">
              {inviteSuccess}
            </div>
          )}

          <form className="invite-form" onSubmit={handleInvite}>
            <div className="invite-inputs-row">
              <div className="invite-input-group flex-2">
                <Mail size={16} className="invite-field-icon" />
                <input
                  type="email"
                  placeholder="Email address (e.g. alex@team.com)"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (inviteError) setInviteError('');
                  }}
                  className="invite-input"
                  required
                />
              </div>

              <div className="invite-input-group flex-1">
                <input
                  type="text"
                  placeholder="Full Name (optional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="invite-input"
                />
              </div>

              <div className="invite-input-group role-group">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="invite-role-select"
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <button type="submit" className="btn-send-invite">
                <UserPlus size={16} />
                <span>Invite</span>
              </button>
            </div>
          </form>

          {/* Quick Share Link */}
          <div className="share-link-row">
            <span className="share-link-label">Or share invite link:</span>
            <button type="button" className="btn-copy-invite-link" onClick={handleCopyLink}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Workspace Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Members List Section */}
        <div className="members-list-container">
          <div className="members-list-header">
            <div className="members-count-badge">
              <UserCheck size={14} />
              <span>{members.length} Active Members</span>
            </div>

            <div className="members-search-wrapper">
              <Search size={14} className="members-search-icon" />
              <input
                type="text"
                placeholder="Search member..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="members-search-input"
              />
            </div>
          </div>

          <div className="members-scrollable-list">
            {filteredMembers.length === 0 ? (
              <div className="no-members-found">
                <p>No team members found matching "{searchFilter}"</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isOwner = member.role === 'Owner';
                return (
                  <div key={member.id} className="member-row-card">
                    <div className="member-avatar-container">
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className="member-avatar-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
                        }}
                      />
                      <span className={`member-status-dot ${member.online !== false ? 'online' : 'offline'}`} />
                    </div>

                    <div className="member-info-col">
                      <div className="member-name-row">
                        <span className="member-fullname">{member.name}</span>
                        {isOwner && (
                          <span className="badge-owner">
                            <Crown size={12} /> Owner
                          </span>
                        )}
                      </div>
                      <span className="member-email-text">{member.email}</span>
                    </div>

                    <div className="member-actions-col">
                      {!isOwner ? (
                        <select
                          value={member.role || 'Member'}
                          onChange={(e) => onUpdateRole && onUpdateRole(member.id, e.target.value)}
                          className={`member-role-badge-select role-${(member.role || 'member').toLowerCase()}`}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Member">Member</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="member-role-badge role-owner">Owner</span>
                      )}

                      {!isOwner && (
                        <button
                          type="button"
                          className="btn-remove-member"
                          onClick={() => onRemoveMember && onRemoveMember(member.id)}
                          title="Remove member"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-primary-close" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
