import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TodoList from './TodoList';
import { useHistory } from 'react-router-dom';

function TodoApp({ setIsAuthenticated }) {
  const [lists, setLists] = useState([]);
  const [newListTitle, setNewListTitle] = useState('');
  const history = useHistory();

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await axios.get('/api/lists');
      setLists(response.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setIsAuthenticated(false);
        history.push('/login');
      }
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const response = await axios.post('/api/lists', { title: newListTitle });
      setLists([...lists, response.data]);
      setNewListTitle('');
    } catch (err) {
      console.error('Error creating list:', err);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    history.push('/login');
  };

  return (
    <div className="todo-app">
      <header>
        <h1>Hierarchical Todo Lists</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <div className="create-list">
        <form onSubmit={handleCreateList}>
          <input
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="New List Title"
          />
          <button type="submit">Create List</button>
        </form>
      </div>

      <div className="lists-container">
        {lists.map((list) => (
          <TodoList key={list.id} list={list} />
        ))}
      </div>
    </div>
  );
}

export default TodoApp;