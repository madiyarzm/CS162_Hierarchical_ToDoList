import React, { useState } from 'react';
import axios from 'axios';

function TodoItem({ item, onUpdate, onDelete, listId, level }) {
  const [newSubItemContent, setNewSubItemContent] = useState('');
  const [showSubItemForm, setShowSubItemForm] = useState(false);

  const handleToggleComplete = () => {
    onUpdate(item.id, { completed: !item.completed });
  };

  const handleToggleExpand = () => {
    onUpdate(item.id, { is_expanded: !item.is_expanded });
  };

  const handleCreateSubItem = async (e) => {
    e.preventDefault();
    if (!newSubItemContent.trim() || level >= 2) return; // Limit to 3 levels

    try {
      const response = await axios.post(`/api/lists/${listId}/items`, {
        content: newSubItemContent,
        parent_id: item.id
      });
      
      // After creating sub-item, update the parent to fetch new children
      onUpdate(item.id, {});
      setNewSubItemContent('');
      setShowSubItemForm(false);
    } catch (err) {
      console.error('Error creating sub-item:', err);
    }
  };

  const getMarginLeft = () => {
    return `${level * 20}px`; // Increase indentation for each level
  };

  return (
    <div className="todo-item" style={{ marginLeft: getMarginLeft() }}>
      <div className="item-content">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={handleToggleComplete}
        />
        <span className={item.completed ? 'completed' : ''}>
          {item.content}
        </span>
        {item.children && item.children.length > 0 && (
          <button onClick={handleToggleExpand}>
            {item.is_expanded ? '▼' : '▶'}
          </button>
        )}
        {level < 2 && (
          <button onClick={() => setShowSubItemForm(!showSubItemForm)}>
            + Sub-item
          </button>
        )}
        <button onClick={() => onDelete(item.id)}>Delete</button>
      </div>

      {showSubItemForm && (
        <form onSubmit={handleCreateSubItem} className="sub-item-form">
          <input
            type="text"
            value={newSubItemContent}
            onChange={(e) => setNewSubItemContent(e.target.value)}
            placeholder="New Sub-item"
          />
          <button type="submit">Add</button>
          <button type="button" onClick={() => setShowSubItemForm(false)}>
            Cancel
          </button>
        </form>
      )}

      {item.is_expanded && item.children && item.children.map((child) => (
        <TodoItem
          key={child.id}
          item={child}
          onUpdate={onUpdate}
          onDelete={onDelete}
          listId={listId}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export default TodoItem;