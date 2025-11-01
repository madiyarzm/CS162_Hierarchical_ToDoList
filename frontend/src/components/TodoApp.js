// Main todo application UI: lists, tabs, and high-level actions
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TodoList from './TodoList';
import { useHistory } from 'react-router-dom';

function TodoApp({ setIsAuthenticated }) {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [newListTitle, setNewListTitle] = useState('');
  const history = useHistory();

  // selectedList: the list shown in the preview area
  // activeTab: 'preview' shows tasks, 'dashboard' shows list management

  useEffect(() => {
    // Load user's lists when the app starts
    fetchLists();
  }, []);

  const fetchLists = async () => {
    // Get lists from the backend for the logged-in user
    try {
      const response = await axios.get('/api/lists');
      setLists(response.data);
      if (response.data.length > 0 && !selectedList) {
        setSelectedList(response.data[0]);
      }
    } catch (err) {
      // If not authenticated, redirect to login
      if (err.response && err.response.status === 401) {
        setIsAuthenticated(false);
        history.push('/login');
      }
    }
  };

  const handleLogout = () => {
    // Local logout: clear UI auth state and go back to login screen
    setIsAuthenticated(false);
    history.push('/login');
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    // Create a new list on the server and select it locally
    try {
      const response = await axios.post('/api/lists', { title: newListTitle });
      setLists([...lists, response.data]);
      setSelectedList(response.data);
      setNewListTitle('');
      setActiveTab('preview'); // Switch to preview tab to see the new list
    } catch (err) {
      console.error('Error creating list:', err);
    }
  };

  return (
    <div className="todo-app">
      <nav className="top-navbar">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
        <div className="nav-actions">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="app-content">
        {activeTab === 'preview' && (
          lists.length > 0 ? (
            <div className="preview-container">
              <div className="list-selector-bar">
                <label className="list-selector-label">Viewing:</label>
                <select 
                  value={selectedList?.id || ''} 
                  onChange={(e) => {
                    const list = lists.find(l => l.id === parseInt(e.target.value));
                    setSelectedList(list);
                  }}
                  className="list-select"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
                <span className="list-selector-hint">💡 Use the move button (→) on top-level tasks to move them between lists</span>
              </div>
              {selectedList && (
                <TodoList list={selectedList} lists={lists} onListRefresh={fetchLists} />
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>No lists found. Please create a list first from the Dashboard tab.</p>
            </div>
          )
        )}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <h2 className="dashboard-title">My Lists</h2>
            
            <form onSubmit={handleCreateList} className="create-list-form">
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list name..."
                className="create-list-input"
              />
              <button type="submit" className="create-list-btn">
                Create List
              </button>
            </form>

            {lists.length > 0 && (
              <div className="list-selector">
                <label className="list-selector-label">Select an existing list:</label>
                <select 
                  value={selectedList?.id || ''} 
                  onChange={(e) => {
                    const list = lists.find(l => l.id === parseInt(e.target.value));
                    setSelectedList(list);
                  }}
                  className="list-select"
                >
                  <option value="">Select a list...</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {lists.length === 0 && (
              <div className="empty-lists-message">
                <p>No lists yet. Create your first list above!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TodoApp;