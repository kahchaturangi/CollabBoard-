import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Briefcase,
  BadgeCheck,
  Code2,
  CheckCircle2,
  Clock,
  Edit3,
  Save,
  Users,
  Sparkles,
  ExternalLink,
  Plus,
} from 'lucide-react';

export default function Profile({
  members = [],
  setMembers,
  tasks = [],
  currentUser,
  setCurrentUser,
}) {
  const navigate = useNavigate();

  // Selected member to view/edit in the profile view (defaults to 1st member)
  const activeMember =
    members.find((m) => m.id === (currentUser?.id || 'mem-1')) || members[0] || {};

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    role: 'Member',
    designation: '',
    bio: '',
    skills: [],
    avatar: '',
    online: true,
    ...activeMember,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync form data when active member changes
  const handleSelectMember = (member) => {
    if (!member) return;
    if (setCurrentUser) setCurrentUser(member);
    setFormData({
      name: '',
      email: '',
      studentId: '',
      role: 'Member',
      designation: '',
      bio: '',
      skills: [],
      avatar: '',
      online: true,
      ...member,
    });
    setIsEditing(false);
    setSaveSuccess(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!setMembers) return;

    setMembers((prev) =>
      prev.map((m) => (m.id === formData.id ? { ...formData } : m))
    );
    if (setCurrentUser && currentUser?.id === formData.id) {
      setCurrentUser(formData);
    }
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Find tasks assigned to this active member
  const memberTasks = tasks.filter((t) => {
    if (!t || !t.assignee || !formData || !formData.name) return false;
    const memberFirst = formData.name.split(' ')[0].toLowerCase();
    return t.assignee.toLowerCase().includes(memberFirst);
  });

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="profile-page-container">
      {/* Top Bar Navigation */}
      <div className="profile-topbar">
        <button
          type="button"
          className="btn-back-dashboard"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>

        <div className="profile-topbar-title">
          <Sparkles size={18} className="sparkle-icon" />
          <span>Team Profile & Member Directory ({members.length} Members)</span>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: Active Member Card & Editor */}
        <div className="profile-main-card">
          <div className="profile-card-banner">
            <span className={`role-pill role-${(formData.role || 'member').toLowerCase()}`}>
              {formData.role || 'Member'}
            </span>
          </div>

          <div className="profile-card-body">
            <div className="profile-avatar-row">
              <div className="profile-avatar-wrapper">
                <img
                  src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`}
                  alt={formData.name}
                  className="profile-avatar-large"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = avatarPresets[0];
                  }}
                />
                <span className={`profile-status-indicator ${formData.online ? 'online' : 'offline'}`} />
              </div>

              <div className="profile-actions-top">
                {!isEditing ? (
                  <button
                    type="button"
                    className="btn-edit-profile"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-save-profile"
                    onClick={handleSaveProfile}
                  >
                    <Save size={15} />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>
            </div>

            {saveSuccess && (
              <div className="save-alert-banner">
                <CheckCircle2 size={16} />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            {/* Profile Info Form / View */}
            <form onSubmit={handleSaveProfile} className="profile-details-form">
              {isEditing ? (
                /* Editable Form */
                <div className="form-fields-grid">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Full Name</label>
                    <input
                      type="text"
                      className="profile-form-input"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Student / Employee ID</label>
                    <input
                      type="text"
                      className="profile-form-input"
                      value={formData.studentId || ''}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Email Address</label>
                    <input
                      type="email"
                      className="profile-form-input"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Role in Board</label>
                    <select
                      className="profile-form-select"
                      value={formData.role || 'Member'}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                    >
                      <option value="Owner">Owner</option>
                      <option value="Admin">Admin</option>
                      <option value="Member">Member</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>

                  <div className="profile-form-group full-width">
                    <label className="profile-form-label">Designation / Specialization</label>
                    <input
                      type="text"
                      className="profile-form-input"
                      value={formData.designation || ''}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                    />
                  </div>

                  <div className="profile-form-group full-width">
                    <label className="profile-form-label">Bio & Responsibilities</label>
                    <textarea
                      className="profile-form-textarea"
                      rows={3}
                      value={formData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                    />
                  </div>

                  {/* Avatar Picker */}
                  <div className="profile-form-group full-width">
                    <label className="profile-form-label">Choose Avatar Preset</label>
                    <div className="avatar-presets-row">
                      {avatarPresets.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="Preset"
                          className={`avatar-preset-thumb ${formData.avatar === url ? 'selected' : ''}`}
                          onClick={() => handleInputChange('avatar', url)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="profile-display-info">
                  <div className="profile-name-header">
                    <h2 className="profile-name">{formData.name}</h2>
                    {formData.studentId && (
                      <span className="profile-id-badge">
                        <BadgeCheck size={13} /> {formData.studentId}
                      </span>
                    )}
                  </div>
                  <p className="profile-designation">{formData.designation || 'Team Member'}</p>

                  <div className="profile-info-items">
                    <div className="info-item">
                      <Mail size={16} className="info-icon" />
                      <span>{formData.email}</span>
                    </div>
                    <div className="info-item">
                      <Shield size={16} className="info-icon" />
                      <span>Role: <strong>{formData.role || 'Member'}</strong></span>
                    </div>
                    <div className="info-item">
                      <Briefcase size={16} className="info-icon" />
                      <span>Status: <strong style={{ color: formData.online ? '#10b981' : '#94a3b8' }}>{formData.online ? 'Online' : 'Offline'}</strong></span>
                    </div>
                  </div>

                  {formData.bio && (
                    <div className="profile-bio-box">
                      <h4 className="bio-title">About & Responsibilities</h4>
                      <p className="bio-text">{formData.bio}</p>
                    </div>
                  )}

                  {formData.skills && formData.skills.length > 0 && (
                    <div className="profile-skills-box">
                      <h4 className="bio-title">Key Skills & Tech Stack</h4>
                      <div className="skills-tags-wrap">
                        {formData.skills.map((skill, index) => (
                          <span key={index} className="skill-chip">
                            <Code2 size={12} /> {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Assigned Tasks for this Member */}
            <div className="member-assigned-tasks-box">
              <h3 className="section-title">
                <CheckCircle2 size={16} /> Tasks Assigned to {formData.name} ({memberTasks.length})
              </h3>
              {memberTasks.length === 0 ? (
                <div className="no-assigned-tasks">
                  <p>No tasks currently assigned to this member.</p>
                </div>
              ) : (
                <div className="assigned-tasks-list">
                  {memberTasks.map((t) => (
                    <div key={t.id} className="assigned-task-item">
                      <div className="assigned-task-left">
                        <span className={`status-pill status-${t.status}`}>
                          {t.status?.replace('_', ' ')}
                        </span>
                        <span className="assigned-task-title">{t.title}</span>
                      </div>
                      <div className="assigned-task-meta">
                        {t.dueDate && (
                          <span className="task-due-date">
                            <Clock size={12} /> {t.dueDate}
                          </span>
                        )}
                        <span className={`priority-tag priority-${t.priority}`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Group Directory (All 7 Members) */}
        <div className="profile-group-directory">
          <div className="directory-header">
            <div className="directory-header-title">
              <Users size={18} />
              <h3>All 7 Group Members</h3>
            </div>
            <span className="group-badge">Project Team</span>
          </div>
          <p className="directory-subtitle">
            Click on any member to view or edit their profile & assigned tasks:
          </p>

          <div className="members-directory-grid">
            {members.map((member, index) => {
              const isSelected = member.id === formData.id;
              const assignedCount = tasks.filter((t) => {
                if (!t || !t.assignee || !member || !member.name) return false;
                const memberFirst = member.name.split(' ')[0].toLowerCase();
                return t.assignee.toLowerCase().includes(memberFirst);
              }).length;

              return (
                <div
                  key={member.id || index}
                  className={`member-directory-card ${isSelected ? 'active-card' : ''}`}
                  onClick={() => handleSelectMember(member)}
                >
                  <div className="directory-card-top">
                    <div className="directory-avatar-box">
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className="directory-avatar-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = avatarPresets[index % avatarPresets.length];
                        }}
                      />
                      <span className={`directory-online-dot ${member.online ? 'online' : 'offline'}`} />
                    </div>

                    <div className="directory-member-meta">
                      <div className="directory-name-row">
                        <span className="directory-name">{member.name}</span>
                        {member.role === 'Owner' && <span className="mini-owner-badge">Owner</span>}
                      </div>
                      <span className="directory-designation">{member.designation || 'Team Member'}</span>
                      <span className="directory-email">{member.email}</span>
                    </div>
                  </div>

                  <div className="directory-card-bottom">
                    {member.studentId && (
                      <span className="directory-id-tag">ID: {member.studentId}</span>
                    )}
                    <span className="directory-task-count">
                      {assignedCount} {assignedCount === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
