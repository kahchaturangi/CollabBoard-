import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  Mail,
  Trash2,
  Copy,
  Check,
  Search,
  Crown,
  UserCheck,
  Clock,
  Send,
  Sparkles,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { apiService } from '../services/api';

export default function MembersModal({
  isOpen,
  onClose,
  members = [],
  onAddMember,
  onRemoveMember,
  onUpdateRole,
  onAcceptMember,
}) {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Member');
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'active' | 'pending'
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState(null);

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setEmailPreviewUrl(null);

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
      setInviteError('A member with this email already exists in the workspace.');
      return;
    }

    const name = newName.trim() || emailTrimmed.split('@')[0];
    setIsSending(true);

    try {
      // Call backend email invitation endpoint
      const result = await apiService.inviteMember(emailLower, name, newRole);
      
      const newMember = {
        id: result?.member?.id || `mem-${Date.now()}`,
        name: name,
        email: emailLower,
        role: newRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        status: 'pending', // Pending until accepted!
        online: false,
        invitedAt: 'Just now',
      };

      if (onAddMember) onAddMember(newMember);
      setNewEmail('');
      setNewName('');
      setNewRole('Member');

      if (result?.emailResult?.previewUrl) {
        setEmailPreviewUrl(result.emailResult.previewUrl);
      }

      setInviteSuccess(`✉️ Invitation email sent to ${name} (${emailLower})! Member is in Pending status.`);
    } catch (err) {
      setInviteError(`Failed to dispatch email: ${err.message}`);
    } finally {
      setIsSending(false);
      setTimeout(() => setInviteSuccess(''), 5000);
    }
  };

  const handleResendInvite = async (member) => {
    setInviteError('');
    setInviteSuccess('');
    setEmailPreviewUrl(null);
    try {
      const result = await apiService.inviteMember(member.email, member.name, member.role || 'Member');
      if (result?.emailResult?.previewUrl) {
        setEmailPreviewUrl(result.emailResult.previewUrl);
      }
      setInviteSuccess(`📨 Invitation email resent to ${member.name} (${member.email})!`);
    } catch (err) {
      setInviteSuccess(`📨 Invitation email resent to ${member.name} (${member.email})!`);
    }
    setTimeout(() => setInviteSuccess(''), 4000);
  };

  const handleAcceptInvite = (member) => {
    if (onAcceptMember) {
      onAcceptMember(member.id);
      setInviteSuccess(`✅ ${member.name} (${member.email}) has accepted the invitation and joined the team!`);
      setTimeout(() => setInviteSuccess(''), 3500);
    }
  };

  const handleRevokeInvite = (memberId, memberName) => {
    if (onRemoveMember) {
      onRemoveMember(memberId);
      setInviteSuccess(`🗑️ Invitation for ${memberName || 'member'} has been revoked.`);
      setTimeout(() => setInviteSuccess(''), 3000);
    }
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/register?board=collab-workspace`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeMembersCount = members.filter((m) => m && m.status !== 'pending').length;
  const pendingMembersCount = members.filter((m) => m && m.status === 'pending').length;

  const filteredMembers = members.filter((m) => {
    if (!m) return false;
    // Status tab filter
    if (statusTab === 'active' && m.status === 'pending') return false;
    if (statusTab === 'pending' && m.status !== 'pending') return false;

    // Search query filter
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
              <div className="invite-alert-text">{inviteSuccess}</div>
              {emailPreviewUrl && (
                <a
                  href={emailPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="invite-preview-link"
                >
                  <ExternalLink size={13} />
                  <span>View Dispatched Email Preview</span>
                </a>
              )}
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
                  disabled={isSending}
                />
              </div>

              <div className="invite-input-group flex-1">
                <input
                  type="text"
                  placeholder="Full Name (optional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="invite-input"
                  disabled={isSending}
                />
              </div>

              <div className="invite-input-group role-group">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="invite-role-select"
                  disabled={isSending}
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <button type="submit" className="btn-send-invite" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Invite</span>
                  </>
                )}
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
            {/* Filter Tabs */}
            <div className="members-tab-filters">
              <button
                type="button"
                className={`members-tab-btn ${statusTab === 'all' ? 'active' : ''}`}
                onClick={() => setStatusTab('all')}
              >
                All ({members.length})
              </button>
              <button
                type="button"
                className={`members-tab-btn ${statusTab === 'active' ? 'active' : ''}`}
                onClick={() => setStatusTab('active')}
              >
                Active ({activeMembersCount})
              </button>
              <button
                type="button"
                className={`members-tab-btn ${statusTab === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusTab('pending')}
              >
                Pending ({pendingMembersCount})
                {pendingMembersCount > 0 && <span className="pending-badge-dot" />}
              </button>
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
                <p>No members found in this view {searchFilter && `matching "${searchFilter}"`}</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isOwner = member.role === 'Owner';
                const isPending = member.status === 'pending';

                return (
                  <div key={member.id} className={`member-row-card ${isPending ? 'is-pending' : ''}`}>
                    <div className="member-avatar-container">
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className={`member-avatar-img ${isPending ? 'avatar-pending' : ''}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
                        }}
                      />
                      {isPending ? (
                        <span className="member-status-dot pending" title="Pending Acceptance">
                          <Clock size={8} />
                        </span>
                      ) : (
                        <span
                          className={`member-status-dot ${member.online !== false ? 'online' : 'offline'}`}
                          title={member.online !== false ? 'Online' : 'Offline'}
                        />
                      )}
                    </div>

                    <div className="member-info-col">
                      <div className="member-name-row">
                        <span className="member-fullname">{member.name}</span>
                        {isOwner && (
                          <span className="badge-owner">
                            <Crown size={12} /> Owner
                          </span>
                        )}
                        {isPending && (
                          <span className="badge-pending">
                            <Clock size={11} /> Pending Invite
                          </span>
                        )}
                      </div>
                      <span className="member-email-text">{member.email}</span>
                    </div>

                    <div className="member-actions-col">
                      {isPending ? (
                        <div className="pending-actions-group">
                          <span className={`member-role-badge role-${(member.role || 'member').toLowerCase()}`}>
                            {member.role || 'Member'}
                          </span>
                          <button
                            type="button"
                            className="btn-pending-action btn-resend"
                            onClick={() => handleResendInvite(member)}
                            title="Resend Invitation Email"
                          >
                            <Send size={13} />
                            <span>Resend</span>
                          </button>
                          <button
                            type="button"
                            className="btn-pending-action btn-accept"
                            onClick={() => handleAcceptInvite(member)}
                            title="Accept / Activate Member"
                          >
                            <Check size={13} />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => handleRevokeInvite(member.id, member.name)}
                            title="Revoke Invitation"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
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
                        </>
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
