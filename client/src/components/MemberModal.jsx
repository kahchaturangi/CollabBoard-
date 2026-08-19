import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { apiService } from '../services/api';

export default function MemberModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const result = await apiService.addMember(email);
      setMessage(`${result.member.username} added to this board.`);
      setEmail('');
    } catch (error) {
      setIsError(true);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content member-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Add a member</h3>
            <p className="member-modal-subtitle">Invite a registered user to your live board.</p>
          </div>
          <button className="action-icon-btn" onClick={onClose} aria-label="Close add member dialog">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="member-email">Member email</label>
          <input
            id="member-email"
            className="form-input"
            type="email"
            placeholder="member@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {message && <p className={isError ? 'member-message error' : 'member-message'}>{message}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <UserPlus size={16} />
              {loading ? 'Adding...' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
