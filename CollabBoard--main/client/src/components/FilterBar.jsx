import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedPriority,
  setSelectedPriority,
  selectedTag,
  setSelectedTag,
  availableTags,
}) {
  const priorities = ['all', 'high', 'medium', 'low'];

  const hasActiveFilters = searchQuery || selectedPriority !== 'all' || selectedTag !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPriority('all');
    setSelectedTag('all');
  };

  return (
    <div className="filter-bar">
      <div className="search-input-wrapper">
        <Search size={18} />
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <span className="filter-label">Priority:</span>
        {priorities.map((p) => (
          <span
            key={p}
            className={`filter-chip ${selectedPriority === p ? 'active' : ''}`}
            onClick={() => setSelectedPriority(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </span>
        ))}
      </div>

      {availableTags.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">Tag:</span>
          <span
            className={`filter-chip ${selectedTag === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTag('all')}
          >
            All
          </span>
          {availableTags.map((tag) => (
            <span
              key={tag}
              className={`filter-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          <X size={14} /> Clear Filters
        </button>
      )}
    </div>
  );
}
