import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import SplashScreen from './components/SplashScreen';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import TaskEditModal from './components/TaskEditModal';
import MembersModal from './components/MembersModal';
import Profile from './components/Profile';
import AcceptInvite from './components/AcceptInvite';
import ConflictBanner from './components/ConflictBanner';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { INITIAL_COLUMNS, INITIAL_TASKS, INITIAL_MEMBERS } from './mockData';
import { apiService } from './services/api';
import { connectSocket, getSocket } from './services/socket';

export default function App() {
  const [boardId, setBoardId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));
  });
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [currentUser, setCurrentUser] = useState(INITIAL_MEMBERS[0]);
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [sortBy, setSortBy] = useState('none');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [showSplash, setShowSplash] = useState(true);

  // Real-time WebSocket sync & concurrency conflict handler
  const {
    conflict,
    clearConflict,
    onlineUserIds,
    moveTask,
    updateTask,
    createTask,
    deleteTask,
  } = useRealtimeSync(boardId || 'default-board', setTasks);

  // Auto‑redirect if a valid token already exists (e.g., page refresh)
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedBoardId = localStorage.getItem('boardId') || sessionStorage.getItem('boardId');
    if (token) {
      setIsAuthenticated(true);
      if (storedBoardId) setBoardId(storedBoardId);
      // Initialize socket connection when authenticated
      connectSocket();
    }
  }, []);

  // Fetch tasks from API on login
  useEffect(() => {
    if (isAuthenticated) {
      apiService.fetchTasks().then((fetched) => {
        if (fetched && fetched.length > 0) {
          setTasks(fetched);
        }
      });
    }
  }, [isAuthenticated]);

  // Set up listeners for member events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMemberAccepted = (data) => {
      if (!data || !data.email) return;
      console.log('⚡ Real-time Socket Event: Member Accepted', data);
      setMembers((prev) => {
        const emailLower = data.email.toLowerCase();
        const exists = prev.some((m) => m && m.email && m.email.toLowerCase() === emailLower);

        if (exists) {
          return prev.map((m) =>
            m && m.email && m.email.toLowerCase() === emailLower
              ? { ...m, status: 'active', online: true, role: data.role || m.role }
              : m
          );
        } else {
          return [
            ...prev,
            {
              id: `mem-${Date.now()}`,
              name: data.name || emailLower.split('@')[0],
              email: emailLower,
              role: data.role || 'Member',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name || emailLower)}`,
              status: 'active',
              online: true,
            },
          ];
        }
      });
    };

    const handleMemberInvited = (data) => {
      if (!data || !data.email) return;
      console.log('⚡ Real-time Socket Event: Member Invited', data);
      setMembers((prev) => {
        const emailLower = data.email.toLowerCase();
        const exists = prev.some((m) => m && m.email && m.email.toLowerCase() === emailLower);
        if (exists) return prev;
        return [...prev, data];
      });
    };

    socket.on('member_accepted', handleMemberAccepted);
    socket.on('member:accepted', handleMemberAccepted);
    socket.on('member_invited', handleMemberInvited);

    return () => {
      socket.off('member_accepted', handleMemberAccepted);
      socket.off('member:accepted', handleMemberAccepted);
      socket.off('member_invited', handleMemberInvited);
    };
  }, []);

  // Extract unique available tags from tasks
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    tasks.forEach((t) => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [tasks]);

  // Extract unique assignees from tasks
  const availableAssignees = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.assignee && typeof t.assignee === 'string' && t.assignee.trim()) {
        set.add(t.assignee.trim());
      }
    });
    return Array.from(set);
  }, [tasks]);

  // Comprehensive task filtering and sorting
  const filteredTasks = useMemo(() => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    let result = tasks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q));

      const matchesPriority =
        !selectedPriority ||
        selectedPriority === 'all' ||
        (t.priority && t.priority.toLowerCase() === selectedPriority.toLowerCase());

      const matchesTag =
        !selectedTag ||
        selectedTag === 'all' ||
        (Array.isArray(t.tags) && t.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase()));

      const matchesAssignee =
        !selectedAssignee ||
        selectedAssignee === 'all' ||
        (t.assignee && typeof t.assignee === 'string' && t.assignee.toLowerCase() === selectedAssignee.toLowerCase());

      return matchesSearch && matchesPriority && matchesTag && matchesAssignee;
    });

    if (sortBy === 'dueDateAsc') {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (sortBy === 'dueDateDesc') {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      });
    } else if (sortBy === 'priorityDesc') {
      result.sort(
        (a, b) => (priorityWeight[b.priority?.toLowerCase()] || 0) - (priorityWeight[a.priority?.toLowerCase()] || 0)
      );
    } else if (sortBy === 'priorityAsc') {
      result.sort(
        (a, b) => (priorityWeight[a.priority?.toLowerCase()] || 0) - (priorityWeight[b.priority?.toLowerCase()] || 0)
      );
    } else if (sortBy === 'titleAsc') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [tasks, searchQuery, selectedPriority, selectedTag, selectedAssignee, sortBy]);

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const taskToDelete = tasks.find((t) => String(t.id || t._id) === String(taskId));
      setTasks((prev) => prev.filter((t) => String(t.id || t._id) !== String(taskId)));

      if (taskToDelete) {
        const res = await deleteTask(taskToDelete);
        if (!res || !res.success) {
          if (res?.error !== 'conflict') {
            await apiService.deleteTask(taskId);
          }
        }
      } else {
        await apiService.deleteTask(taskId);
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const handleOpenAddModal = (status = 'todo') => {
    setDefaultStatus(status);
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      const taskId = taskData.id || taskData._id;
      const existingTask = tasks.find((t) => String(t.id || t._id) === String(taskId));

      if (taskId && existingTask) {
        // Optimistic UI update
        const updatedTask = { ...existingTask, ...taskData };
        setTasks((prev) =>
          prev.map((t) => (String(t.id || t._id) === String(taskId) ? updatedTask : t))
        );

        const res = await updateTask(existingTask, taskData);
        if (!res || !res.success) {
          if (res?.error !== 'conflict') {
            await apiService.updateTask(taskId, taskData);
          }
        }
      } else {
        const newTask = {
          ...taskData,
          id: taskData.id || `task-${Date.now()}`,
          version: 0,
        };
        setTasks((prev) => [newTask, ...prev]);

        const res = await createTask(newTask);
        if (!res || !res.success) {
          await apiService.createTask(newTask);
        }
      }
    } catch (err) {
      console.error('Save task error:', err);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const task = tasks.find((t) => String(t.id || t._id) === String(draggableId));
    if (!task) return;

    const updatedTask = { ...task, status: newStatus };
    setTasks((prev) =>
      prev.map((t) => (String(t.id || t._id) === String(draggableId) ? updatedTask : t))
    );

    try {
      const res = await moveTask(task, newStatus);
      if (!res || !res.success) {
        if (res?.error !== 'conflict') {
          await apiService.updateTask(task.id || task._id, updatedTask);
        }
      }
    } catch (err) {
      console.error('Drag end move socket error, falling back to API:', err);
      try {
        await apiService.updateTask(task.id || task._id, updatedTask);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddMember = (newMember) => {
    setMembers((prev) => [...prev, newMember]);
  };

  const handleRemoveMember = (memberId) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleUpdateRole = (memberId, newRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  const handleAcceptMember = (memberId) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: 'active', online: true } : m))
    );
  };

  return (
    <>
      {showSplash ? <SplashScreen /> : null}
      <Router>
        <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Public routes – redirect if already logged in */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login setIsAuthenticated={setIsAuthenticated} setBoardId={setBoardId} />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register setIsAuthenticated={setIsAuthenticated} setBoardId={setBoardId} />
              )
            }
          />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          {/* Protected dashboard route */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <>
                  <Navbar
                    onOpenAddModal={() => handleOpenAddModal('todo')}
                    onOpenMembersModal={() => setIsMembersModalOpen(true)}
                    members={members}
                    currentUser={currentUser}
                    setIsAuthenticated={setIsAuthenticated}
                    setBoardId={setBoardId}
                  />
                  <main className="dashboard-content">
                    <ConflictBanner conflict={conflict} onDismiss={clearConflict} />
                    <FilterBar
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      selectedPriority={selectedPriority}
                      setSelectedPriority={setSelectedPriority}
                      selectedTag={selectedTag}
                      setSelectedTag={setSelectedTag}
                      availableTags={availableTags}
                      selectedAssignee={selectedAssignee}
                      setSelectedAssignee={setSelectedAssignee}
                      availableAssignees={availableAssignees}
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                    />
                    <KanbanBoard
                      columns={columns}
                      tasks={filteredTasks}
                      onDragEnd={handleDragEnd}
                      onEditTask={handleOpenEditModal}
                      onDeleteTask={handleDeleteTask}
                      onQuickAddTask={handleOpenAddModal}
                    />
                    <TaskEditModal
                      isOpen={isModalOpen}
                      onClose={() => setIsModalOpen(false)}
                      taskToEdit={taskToEdit}
                      onSave={handleSaveTask}
                      defaultStatus={defaultStatus}
                    />
                    <MembersModal
                      isOpen={isMembersModalOpen}
                      onClose={() => setIsMembersModalOpen(false)}
                      members={members}
                      onAddMember={handleAddMember}
                      onRemoveMember={handleRemoveMember}
                      onUpdateRole={handleUpdateRole}
                      onAcceptMember={handleAcceptMember}
                    />
                  </main>
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Protected profile route */}
          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                <>
                  <Navbar
                    onOpenMembersModal={() => setIsMembersModalOpen(true)}
                    members={members}
                    currentUser={currentUser}
                    setIsAuthenticated={setIsAuthenticated}
                    setBoardId={setBoardId}
                  />
                  <main className="profile-page-wrapper">
                    <Profile
                      members={members}
                      setMembers={setMembers}
                      tasks={tasks}
                      currentUser={currentUser}
                      setCurrentUser={setCurrentUser}
                    />
                    <MembersModal
                      isOpen={isMembersModalOpen}
                      onClose={() => setIsMembersModalOpen(false)}
                      members={members}
                      onAddMember={handleAddMember}
                      onRemoveMember={handleRemoveMember}
                      onUpdateRole={handleUpdateRole}
                      onAcceptMember={handleAcceptMember}
                    />
                  </main>
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Catch‑all route – redirect based on auth state */}
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
    </>
  );
}


