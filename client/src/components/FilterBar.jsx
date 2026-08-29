import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowDownUp,
  User,
  RotateCcw,
  Check,
  Calendar,
} from 'lucide-react';

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedPriority,
  setSelectedPriority,
  selectedTag,
  setSelectedTag,
  availableTags = [],
  selectedAssignee = 'all',
  setSelectedAssignee,
  availableAssignees = [],
  sortBy = 'none',
  setSortBy,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const priorities = [
    { id: 'all', label: 'All', className: 'chip-all' },
    { id: 'high', label: 'High', className: 'chip-high' },
    { id: 'medium', label: 'Medium', className: 'chip-medium' },
    { id: 'low', label: 'Low', className: 'chip-low' },
  ];

  const sortOptions = [
    { id: 'none', label: 'Default (Original)' },
    { id: 'dueDateAsc', label: 'Due Date: Earliest First' },
    { id: 'dueDateDesc', label: 'Due Date: Latest First' },
    { id: 'priorityDesc', label: 'Priority: High → Low' },
    { id: 'priorityAsc', label: 'Priority: Low → High' },
    { id: 'titleAsc', label: 'Title: A → Z' },
  ];

  const currentPriority = selectedPriority || 'all';

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const hasAdvancedFilters = (sortBy && sortBy !== 'none') || (selectedAssignee && selectedAssignee !== 'all');

  const hasActiveFilters = Boolean(
    searchQuery ||
    (selectedPriority && selectedPriority !== 'all') ||
    (selectedTag && selectedTag !== 'all') ||
    hasAdvancedFilters
  );

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedPriority('all');
    if (setSelectedTag) setSelectedTag('all');
    if (setSelectedAssignee) setSelectedAssignee('all');
    if (setSortBy) setSortBy('none');
    setIsMenuOpen(false);
  };

  return (
    <div className="filter-bar">
      {/* Search Bar with interactive Filter / Sort Button */}
      <div className="search-input-wrapper" ref={menuRef}>
        <Search size={18} className="search-icon-left" />
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}

        <button
          type="button"
          className={`search-filter-btn ${isMenuOpen || hasAdvancedFilters ? 'active' : ''}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          title="Sort & Filter options"
          aria-expanded={isMenuOpen}
        >
          <SlidersHorizontal size={16} />
          {hasAdvancedFilters && <span className="filter-active-dot" />}
        </button>

        {/* Floating Dropdown Menu */}
        {isMenuOpen && (
          <div className="filter-dropdown-menu">
            <div className="dropdown-header">
              <div className="dropdown-title">
                <SlidersHorizontal size={15} />
                <span>Sort & Filter Options</span>
              </div>
              <button
                type="button"
                className="dropdown-close-btn"
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={14} />
              </button>
            </div>

            {/* Sort Options */}
            {setSortBy && (
              <div className="dropdown-section">
                <div className="dropdown-section-title">
                  <ArrowDownUp size={14} />
                  <span>Sort Tasks By</span>
                </div>
                <div className="dropdown-options-list">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`dropdown-option-item ${sortBy === opt.id ? 'selected' : ''}`}
                      onClick={() => setSortBy(opt.id)}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && <Check size={14} className="check-icon" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assignee Filter */}
            {setSelectedAssignee && availableAssignees && availableAssignees.length > 0 && (
              <div className="dropdown-section">
                <div className="dropdown-section-title">
                  <User size={14} />
                  <span>Filter by Assignee</span>
                </div>
                <div className="dropdown-chips-group">
                  <button
                    type="button"
                    className={`dropdown-chip ${selectedAssignee === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedAssignee('all')}
                  >
                    All Members
                  </button>
                  {availableAssignees.map((person) => (
                    <button
                      key={person}
                      type="button"
                      className={`dropdown-chip ${selectedAssignee === person ? 'active' : ''}`}
                      onClick={() => setSelectedAssignee(person)}
                    >
                      {person}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Footer */}
            {hasAdvancedFilters && (
              <div className="dropdown-footer">
                <button
                  type="button"
                  className="dropdown-reset-btn"
                  onClick={() => {
                    if (setSortBy) setSortBy('none');
                    if (setSelectedAssignee) setSelectedAssignee('all');
                  }}
                >
                  <RotateCcw size={13} /> Reset Sort & Assignee
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Priority Chips */}
      <div className="filter-group">
        <span className="filter-label">Priority:</span>
        {priorities.map((p) => (
          <button
            type="button"
            key={p.id}
            className={`filter-chip ${p.className} ${currentPriority === p.id ? 'active' : ''}`}
            onClick={() => setSelectedPriority(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tag Chips */}
      {availableTags && availableTags.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">Tag:</span>
          <button
            type="button"
            className={`filter-chip ${selectedTag === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTag('all')}
          >
            All
          </button>
          {availableTags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={`filter-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Clear All Filters Button */}
      {hasActiveFilters && (
        <button type="button" className="btn-clear-filters" onClick={clearAllFilters}>
          <X size={14} /> Clear All
        </button>
      )}
    </div>
  );
}

