import React from 'react';
import { LayoutGrid, Plus, Sparkles, UserCheck } from 'lucide-react';

export default function Navbar({ onOpenAddModal, totalTasksCount }) {
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
      </div>
    </header>
  );
}
