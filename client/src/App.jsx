import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import TaskEditModal from './components/TaskEditModal';
import MemberModal from './components/MemberModal';
import SplashScreen from './components/SplashScreen';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './mockData';
import { apiService } from './services/api';
import { taskStorage, offlineQueue } from './services/storage';
import { connectSocket, joinBoard } from './services/socket';

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
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
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setIsSplashVisible(false), 1800);
    return () => window.clearTimeout(splashTimer);
  }, []);

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

  // Replace demo tasks with the current user's board tasks once authenticated.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cancelled = false;

    const loadTasks = async () => {
      const remoteTasks = await apiService.fetchTasks();
      if (!cancelled && remoteTasks) {
        setTasks((currentTasks) => {
          const pendingTasks = currentTasks.filter((task) =>
            task.id?.startsWith('local-')
          );
          const remoteIds = new Set(remoteTasks.map((task) => task.id));
          const stillPending = pendingTasks.filter((task) => !remoteIds.has(task.id));
          return [...remoteTasks, ...stillPending];
        });
      }
    };

    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Join socket room and set up listeners
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const socket = connectSocket();
    if (!socket) return undefined;

    // Join the user's board if available, otherwise fallback to default
    joinBoard(boardId || 'default-board');

    const handleTaskEvent = (data) => {
      const incomingTask = data.task
        ? { ...data.task, id: data.task.id || data.task._id?.toString() }
        : null;

      setTasks((prev) => {
        if (incomingTask?.id) {
          const existingIndex = prev.findIndex((task) => task.id === incomingTask.id);
          if (existingIndex === -1) return [...prev, incomingTask];
          return prev.map((task) => (task.id === incomingTask.id ? incomingTask : task));
        }
        if (data.taskId) return prev.filter((task) => task.id !== data.taskId);
        return prev;
      });
    };

    socket.on('task:created', handleTaskEvent);
    socket.on('task:updated', handleTaskEvent);
    socket.on('task:deleted', handleTaskEvent);
    socket.on('task_created', handleTaskEvent);
    socket.on('task_updated', handleTaskEvent);
    socket.on('task_deleted', handleTaskEvent);

    return () => {
      socket.off('task:created', handleTaskEvent);
      socket.off('task:updated', handleTaskEvent);
      socket.off('task:deleted', handleTaskEvent);
      socket.off('task_created', handleTaskEvent);
      socket.off('task_updated', handleTaskEvent);
      socket.off('task_deleted', handleTaskEvent);
    };
  }, [isAuthenticated, boardId]);

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
    const deletedTask = tasks.find((task) => task.id === taskId);
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));

    try {
      const deleted = await apiService.deleteTask(taskId);
      if (!deleted && deletedTask) {
        setTasks((currentTasks) => [...currentTasks, deletedTask]);
      }
    } catch (err) {
      console.error(err);
      if (deletedTask) setTasks((currentTasks) => [...currentTasks, deletedTask]);
    }
  };

  const handleOpenAddModal = (status = 'todo') => {
    setTaskToEdit(null);
    setDefaultStatus(status);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (task) => {
    const isEditing = Boolean(task.id);

    if (isEditing) {
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id ? { ...currentTask, ...task } : currentTask
        )
      );
    }

    try {
      if (isEditing) {
        const savedTask = await apiService.updateTask(task.id, task);
        if (savedTask?.conflict && savedTask.current) {
          setTasks((currentTasks) =>
            currentTasks.map((currentTask) =>
              currentTask.id === task.id ? savedTask.current : currentTask
            )
          );
        } else if (savedTask?.id) {
          setTasks((currentTasks) =>
            currentTasks.map((currentTask) =>
              currentTask.id === task.id ? savedTask : currentTask
            )
          );
        }
      } else {
        const optimisticId = `local-${Date.now()}`;
        const optimisticTask = { ...task, id: optimisticId };
        setTasks((currentTasks) => [...currentTasks, optimisticTask]);

        const savedTask = await apiService.createTask(task);
        if (savedTask?.id && savedTask.id !== optimisticId) {
          setTasks((currentTasks) =>
            currentTasks.map((currentTask) =>
              currentTask.id === optimisticId ? savedTask : currentTask
            )
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const tasksByColumn = Object.fromEntries(
      columns.map((column) => [
        column.id,
        tasks.filter((task) => task.status === column.id),
      ])
    );
    const movedTask = tasksByColumn[source.droppableId]?.splice(source.index, 1)[0];
    if (!movedTask) return;

    const originalStatus = movedTask.status;
    const updatedTask = { ...movedTask, status: destination.droppableId };
    tasksByColumn[destination.droppableId].splice(destination.index, 0, updatedTask);
    setTasks(columns.flatMap((column) => tasksByColumn[column.id]));

    if (originalStatus !== destination.droppableId) {
      const savedTask = await apiService.updateTask(draggableId, {
        status: destination.droppableId,
        __v: movedTask.__v,
      });

      if (savedTask?.conflict && savedTask.current) {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === draggableId ? savedTask.current : task
          )
        );
      }
    }
  };

  return (
    <>
      {isSplashVisible && <SplashScreen />}
      <Router>
      {isAuthenticated && (
        <Navbar
          onOpenAddModal={handleOpenAddModal}
          onOpenMemberModal={() => setIsMemberModalOpen(true)}
          setIsAuthenticated={setIsAuthenticated}
          setBoardId={setBoardId}
        />
      )}
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
                <MemberModal
                  isOpen={isMemberModalOpen}
                  onClose={() => setIsMemberModalOpen(false)}
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
    </>
  );
}
