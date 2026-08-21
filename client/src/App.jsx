import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import TaskEditModal from './components/TaskEditModal';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './mockData';
import { apiService } from './services/api';
import { taskStorage, offlineQueue } from './services/storage';
import { connectSocket, getSocket, joinBoard } from './services/socket';

export default function App() {
  const [boardId, setBoardId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');

  // Auto‑redirect if a valid token already exists (e.g., page refresh)
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

  // Join socket room and set up listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join the user's board if available, otherwise fallback to default
    joinBoard(boardId || 'default-board');

    const handleTaskEvent = (data) => {
      // data: { action: 'create'|'update'|'delete', task }
      setTasks((prev) => {
        switch (data.action) {
          case 'create':
            return [...prev, data.task];
          case 'update':
            return prev.map((t) => (t.id === data.task.id ? data.task : t));
          case 'delete':
            return prev.filter((t) => t.id !== data.task.id);
          default:
            return prev;
        }
      });
    };

    socket.on('task_created', handleTaskEvent);
    socket.on('task_updated', handleTaskEvent);
    socket.on('task_deleted', handleTaskEvent);

    return () => {
      socket.off('task_created', handleTaskEvent);
      socket.off('task_updated', handleTaskEvent);
      socket.off('task_deleted', handleTaskEvent);
    };
  }, [boardId]);

  // Simple filtering (kept lightweight for demo)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = selectedPriority ? t.priority === selectedPriority : true;
      const matchesTag = selectedTag ? t.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesPriority && matchesTag;
    });
  }, [tasks, searchQuery, selectedPriority, selectedTag]);

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await apiService.deleteTask(taskId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (task) => {
    try {
      if (task.id) {
        await apiService.updateTask(task.id, task);
      } else {
        await apiService.createTask(task);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Router>
      <Navbar setIsAuthenticated={setIsAuthenticated} setBoardId={setBoardId} />
      <Routes>
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
        {/* Protected dashboard route */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <>
                <FilterBar
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedPriority={selectedPriority}
                  setSelectedPriority={setSelectedPriority}
                  selectedTag={selectedTag}
                  setSelectedTag={setSelectedTag}
                  availableTags={availableTags}
                />
                <KanbanBoard
                  columns={columns}
                  tasks={filteredTasks}
                  onDragEnd={() => {}}
                  onEditTask={handleOpenEditModal}
                  onDeleteTask={handleDeleteTask}
                  onQuickAddTask={handleOpenAddModal}
                />
                <TaskEditModal
                  isOpen={isModalOpen}
                  setIsOpen={setIsModalOpen}
                  task={taskToEdit}
                  onSave={handleSaveTask}
                  defaultStatus={defaultStatus}
                />
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
    </Router>
  );
}
