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

function Board({ tasks, setTasks, columns, searchQuery, setSearchQuery, selectedPriority, setSelectedPriority, selectedTag, setSelectedTag, availableTags, filteredTasks, handleDragEnd, handleOpenEditModal, handleDeleteTask, handleOpenAddModal, isModalOpen, setIsModalOpen, handleSaveTask, taskToEdit, defaultStatus, setAuth }) {
  return (
    <div className="app-container">
      <Navbar
        onOpenAddModal={() => handleOpenAddModal('todo')}
        totalTasksCount={tasks.length}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 20px' }}>
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setAuth(false);
          }}
          style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

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
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  const [columns] = useState(INITIAL_COLUMNS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');

  // Fetch tasks on mount if REST API backend is available
  useEffect(() => {
    async function loadTasks() {
      if (isAuthenticated) {
        const serverTasks = await apiService.fetchTasks();
        if (serverTasks && Array.isArray(serverTasks) && serverTasks.length > 0) {
          setTasks(serverTasks);
        }
      }
    }
    loadTasks();
  }, [isAuthenticated]);

  // Compute available tags for filter chips
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    tasks.forEach((t) => {
      if (t.tags) t.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [tasks]);

  // Filter tasks based on Search, Priority, and Tag
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority =
        selectedPriority === 'all' || task.priority === selectedPriority;

      const matchesTag =
        selectedTag === 'all' || (task.tags && task.tags.includes(selectedTag));

      return matchesSearch && matchesPriority && matchesTag;
    });
  }, [tasks, searchQuery, selectedPriority, selectedTag]);

  // Drag and Drop Handler
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const updatedTasks = Array.from(tasks);
    const draggedTaskIndex = updatedTasks.findIndex((t) => t.id === draggableId);
    if (draggedTaskIndex === -1) return;

    const [draggedTask] = updatedTasks.splice(draggedTaskIndex, 1);
    const newStatus = destination.droppableId;
    const updatedTask = { ...draggedTask, status: newStatus };

    const destColumnTasks = updatedTasks.filter((t) => t.status === newStatus);
    const nonDestTasks = updatedTasks.filter((t) => t.status !== newStatus);

    destColumnTasks.splice(destination.index, 0, updatedTask);

    const finalTasks = [...nonDestTasks, ...destColumnTasks];
    setTasks(finalTasks);

    await apiService.updateTask(updatedTask.id, { status: newStatus });
  };

  // Task CRUD Handlers
  const handleOpenAddModal = (status = 'todo') => {
    setTaskToEdit(null);
    setDefaultStatus(status);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    if (taskToEdit) {
      setTasks((prev) => prev.map((t) => (t.id === taskData.id ? taskData : t)));
      await apiService.updateTask(taskData.id, taskData);
    } else {
      setTasks((prev) => [taskData, ...prev]);
      await apiService.createTask(taskData);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await apiService.deleteTask(taskId);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/board" /> : <Login setAuth={setIsAuthenticated} />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/board" /> : <Register setAuth={setIsAuthenticated} />} />
        <Route 
          path="/board" 
          element={
            isAuthenticated ? (
              <Board 
                tasks={tasks} setTasks={setTasks} columns={columns} 
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
                selectedPriority={selectedPriority} setSelectedPriority={setSelectedPriority} 
                selectedTag={selectedTag} setSelectedTag={setSelectedTag} 
                availableTags={availableTags} filteredTasks={filteredTasks} 
                handleDragEnd={handleDragEnd} handleOpenEditModal={handleOpenEditModal} 
                handleDeleteTask={handleDeleteTask} handleOpenAddModal={handleOpenAddModal} 
                isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} 
                handleSaveTask={handleSaveTask} taskToEdit={taskToEdit} defaultStatus={defaultStatus}
                setAuth={setIsAuthenticated}
              />
            ) : <Navigate to="/login" />
          } 
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/board" : "/login"} />} />
      </Routes>
    </Router>
  );
}
