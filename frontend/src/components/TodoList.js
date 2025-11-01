import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TodoItem from './TodoItem';

function TodoList({ list }) {
  const [items, setItems] = useState([]);
  const [newItemContent, setNewItemContent] = useState('');

  useEffect(() => {
    fetchItems();
  }, [list.id]);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`/api/lists/${list.id}/items`);
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItemContent.trim()) return;

    try {
      const response = await axios.post(`/api/lists/${list.id}/items`, {
        content: newItemContent,
      });
      setItems([...items, response.data]);
      setNewItemContent('');
    } catch (err) {
      console.error('Error creating item:', err);
    }
  };

  const handleItemUpdate = async (itemId, updates) => {
    try {
      await axios.put(`/api/items/${itemId}`, updates);
      fetchItems(); // Refresh items to get the updated state
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleItemDelete = async (itemId) => {
    try {
      await axios.delete(`/api/items/${itemId}`);
      setItems(items.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  return (
    <div className="todo-list">
      <h2>{list.title}</h2>
      
      <form onSubmit={handleCreateItem}>
        <input
          type="text"
          value={newItemContent}
          onChange={(e) => setNewItemContent(e.target.value)}
          placeholder="New Item"
        />
        <button type="submit">Add Item</button>
      </form>

      <div className="items-container">
        {items.map((item) => (
          <TodoItem
            key={item.id}
            item={item}
            onUpdate={handleItemUpdate}
            onDelete={handleItemDelete}
            listId={list.id}
            level={0}
          />
        ))}
      </div>
    </div>
  );
}

export default TodoList;