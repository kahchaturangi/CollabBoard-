import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserCheck, CheckCircle2, Loader2, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  const roleParam = searchParams.get('role') || 'Member';

  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  const targetEmail = emailParam || 'team.member@company.com';

  const handleAccept = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await apiService.acceptInvite(token, targetEmail);
      if (res.success) {
        setAccepted(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(res.message || 'Could not accept invitation.');
      }
    } catch (err) {
      setError(err.message || 'Error accepting invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="accept-invite-page-wrapper">
      <div className="accept-invite-card">
        <div className="accept-invite-header">
          <div className="accept-logo-icon">
            <Sparkles size={28} color="#818cf8" />
          </div>
          <h1 className="accept-title">Workspace Invitation</h1>
          <p className="accept-subtitle">You have been invited to collaborate on CollabBoard</p>
        </div>

        {error && <div className="invite-alert error">{error}</div>}

        {accepted ? (
          <div className="accept-success-box">
            <div className="success-icon-pulse">
              <CheckCircle2 size={48} color="#10b981" />
            </div>
            <h2>Invitation Accepted!</h2>
            <p>Welcome to the team. Redirecting you to the workspace board...</p>
          </div>
        ) : (
          <div className="accept-invite-body">
            <div className="invite-details-box">
              <div className="detail-row">
                <span className="detail-label">Invited Email</span>
                <span className="detail-value highlight">{targetEmail}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Assigned Role</span>
                <span className="detail-value badge-role">{roleParam}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Workspace</span>
                <span className="detail-value">CollabBoard Team Workspace</span>
              </div>
            </div>

            <p className="invite-hint-text">
              By clicking Accept, you will join the team workspace in real-time.
            </p>

            <button
              type="button"
              className="btn-accept-join"
              onClick={handleAccept}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>Joining Workspace...</span>
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  <span>Accept & Join Team</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
