// Component that renders a single todo list and its items
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TodoItem from './TodoItem';

function TodoList({ list, lists, onListRefresh }) {
  // Props:
  // - list: the currently selected list object (id, title)
  // - lists: array of all lists (used for moving tasks between lists)
  // - onListRefresh: callback to refresh lists in parent when they change
  const [items, setItems] = useState([]);
  const [newItemContent, setNewItemContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [dragOverContainer, setDragOverContainer] = useState(false);

  useEffect(() => {
    // Load items for the selected list
    fetchItems();
  }, [list.id]);

  useEffect(() => {
    // Auto-show form when there are no items
    if (items.length === 0 && !showAddForm) {
      setShowAddForm(true);
    }
  }, [items.length]);

  const fetchItems = async () => {
    // Load items for this list from the server (returns nested items)
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
      await axios.post(`/api/lists/${list.id}/items`, {
        content: newItemContent,
      });
      setNewItemContent('');
      setShowAddForm(false);
      fetchItems();
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
      fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleContainerDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if the dragged item is top-level (for moving between lists)
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const draggedListId = data.listId;
      const draggedLevel = data.level || 0;
      
      // Only allow dropping if it's from same list OR it's a top-level task from another list
      if (draggedListId === list.id || draggedLevel === 0) {
        e.dataTransfer.dropEffect = 'move';
        setDragOverContainer(true);
      } else {
        e.dataTransfer.dropEffect = 'none';
        setDragOverContainer(false);
      }
    } catch (err) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverContainer(true);
    }
  };

  const handleContainerDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverContainer(false);
  };

  const handleContainerDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverContainer(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const draggedItemId = data.itemId;
      const draggedListId = data.listId;
      const draggedLevel = data.level || 0;

      // MVP requirement: Only top-level tasks can be moved to different lists
      if (draggedListId !== list.id && draggedLevel !== 0) {
        alert('Only top-level tasks can be moved to different lists');
        return;
      }

      // Make it a top-level item in this list
      if (draggedListId !== list.id) {
        await handleItemUpdate(draggedItemId, { parent_id: null, list_id: list.id });
      } else {
        await handleItemUpdate(draggedItemId, { parent_id: null });
      }
      fetchItems();
    } catch (err) {
      console.error('Error handling container drop:', err);
      alert(err.response?.data?.error || 'Error moving task');
    }
  };

  return (
    <div className="todo-list-container">
      <div className="todo-list-header">
        <h1 className="todo-list-title">Tasks</h1>
        <p className="todo-list-subtitle">Organize your work hierarchically</p>
      </div>
      
      <div 
        className={`items-container ${dragOverContainer ? 'drag-over-container' : ''}`}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        onDrop={handleContainerDrop}
      >
        {dragOverContainer && items.length === 0 && (
          <div className="drop-zone-indicator">Drop here to add as top-level task</div>
        )}
        {items.map((item) => (
          <TodoItem
            key={item.id}
            item={item}
            onUpdate={handleItemUpdate}
            onDelete={handleItemDelete}
            listId={list.id}
            level={0}
            lists={lists}
            onItemMoved={fetchItems}
            allItems={items}
          />
        ))}
        
        {showAddForm ? (
          <form onSubmit={handleCreateItem} className={`add-task-form ${items.length === 0 ? 'empty-state-form' : ''}`}>
            <input
              type="text"
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              placeholder={items.length === 0 ? "Add your first task..." : "Enter task name..."}
              autoFocus
            />
            <div className="add-task-actions">
              <button type="submit" className="add-task-submit">Add</button>
              {items.length > 0 && (
                <button 
                  type="button" 
                  className="add-task-cancel"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAddForm(false);
                    setNewItemContent('');
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <button 
            className="add-task-button"
            onClick={() => setShowAddForm(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add task
          </button>
        )}
      </div>
    </div>
  );
}

export default TodoList;