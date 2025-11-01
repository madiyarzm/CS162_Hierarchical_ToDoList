// Individual todo item: rendering, editing, drag-and-drop and subtask handling
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function TodoItem({ item, onUpdate, onDelete, listId, level, lists, onItemMoved, allItems }) {
  // Props:
  // - item: this task object (id, content, completed, children...)
  // - onUpdate(itemId, updates): callback to send changes to server
  // - onDelete(itemId): callback to delete the task
  // - listId: id of the current list the item belongs to
  // - level: nesting level (0 = top-level)
  // - lists: all available lists (used when moving between lists)
  // - onItemMoved: callback to refresh after moves
  // State notes: showSubItemForm toggles add-subtask UI; dragOver flags control DnD visuals
  const [newSubItemContent, setNewSubItemContent] = useState('');
  const [showSubItemForm, setShowSubItemForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverAsChild, setDragOverAsChild] = useState(false);
  const [showMoveListDropdown, setShowMoveListDropdown] = useState(false);
  const editInputRef = useRef(null);
  const cardRef = useRef(null);
  const moveListDropdownRef = useRef(null);

  // Update edit content when item content changes
  useEffect(() => {
    setEditContent(item.content);
  }, [item.content]);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Close move list dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moveListDropdownRef.current && !moveListDropdownRef.current.contains(event.target)) {
        setShowMoveListDropdown(false);
      }
    };

    if (showMoveListDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoveListDropdown]);

  const handleToggleComplete = () => {
    // Toggle completed state (sends update to backend)
    onUpdate(item.id, { completed: !item.completed });
  };

  const handleToggleExpand = () => {
    onUpdate(item.id, { is_expanded: !item.is_expanded });
  };

  const handleCreateSubItem = async (e) => {
    e.preventDefault();
    if (!newSubItemContent.trim() || level >= 2) return; // Limit to 3 levels
    // Create a subtask and refresh the parent item
    try {
      await axios.post(`/api/lists/${listId}/items`, {
        content: newSubItemContent,
        parent_id: item.id,
      });
      setNewSubItemContent('');
      setShowSubItemForm(false);
      onUpdate(item.id, {}); // Refresh to show new child
    } catch (err) {
      console.error('Error creating sub-item:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(item.content);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent !== item.content) {
      try {
        // Save edited text to the server
        await onUpdate(item.id, { content: editContent.trim() });
      } catch (err) {
        console.error('Error updating content:', err);
      }
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(item.content);
    setIsEditing(false);
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e) => {
    // Start dragging this item (UI + transfer data)
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ 
      itemId: item.id, 
      listId: listId,
      level: level  // Include level to check if it's top-level
    }));
    e.stopPropagation();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(false);
    setDragOverAsChild(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if the dragged item is top-level when moving from different list
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const draggedListId = data.listId;
      const draggedLevel = data.level || 0;
      
      // Only allow dropping if it's from same list OR it's a top-level task from another list
      if (draggedListId === listId || draggedLevel === 0) {
        e.dataTransfer.dropEffect = 'move';
        if (!dragOver && !isDragging) {
          setDragOver(true);
        }
      } else {
        e.dataTransfer.dropEffect = 'none';
        setDragOver(false);
      }
    } catch (err) {
      e.dataTransfer.dropEffect = 'move';
      if (!dragOver && !isDragging) {
        setDragOver(true);
      }
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragOver to false if we're leaving the card entirely
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragOver(false);
        setDragOverAsChild(false);
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOver(false);
    setDragOverAsChild(false);

    // Handle drop: decide if dragged item becomes a child or sibling, then update
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const draggedItemId = data.itemId;
      const draggedListId = data.listId;

      // Don't allow dropping on itself
      if (draggedItemId === item.id) {
        return;
      }

      // Determine drop position (bottom half => child)
      const rect = cardRef.current?.getBoundingClientRect();
      const y = e.clientY;
      const midY = rect ? rect.top + rect.height / 2 : 0;
      const makeChild = y > midY && level < 2;

      let updates = {};
      if (makeChild) {
        updates = { parent_id: item.id, list_id: listId };
      } else {
        const parentId = item.parent_id || null;
        updates = { parent_id: parentId, list_id: listId };
      }

      // Enforce rule: only top-level items may change lists
      const draggedLevel = data.level || 0;
      if (draggedListId !== listId && draggedLevel !== 0) {
        alert('Only top-level tasks can be moved to different lists');
        return;
      }

      // Apply update and refresh
      if (draggedListId !== listId || updates.parent_id !== (item.parent_id || null)) {
        await onUpdate(draggedItemId, updates);
        if (onItemMoved) {
          onItemMoved(); // Refresh the list
        }
      }
    } catch (err) {
      console.error('Error handling drop:', err);
      alert(err.response?.data?.error || 'Error moving task');
    }
  };

  const handleChildrenDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow dragging within same list for children (MVP requirement)
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const draggedListId = data.listId;
      
      // Only allow if from same list, or if top-level from another list (but then it won't become a child)
      if (draggedListId === listId && !isDragging && level < 2) {
        e.dataTransfer.dropEffect = 'move';
        if (!dragOverAsChild) {
          setDragOverAsChild(true);
          setDragOver(false);
        }
      } else {
        e.dataTransfer.dropEffect = 'none';
        setDragOverAsChild(false);
      }
    } catch (err) {
      e.dataTransfer.dropEffect = 'move';
      if (!dragOverAsChild && !isDragging && level < 2) {
        setDragOverAsChild(true);
        setDragOver(false);
      }
    }
  };

  const handleChildrenDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverAsChild(false);
  };

  const handleChildrenDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverAsChild(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const draggedItemId = data.itemId;
      const draggedListId = data.listId;

      if (draggedItemId === item.id || level >= 2) {
        return;
      }

      // Only allow drag-and-drop within the same list (MVP requirement)
      const draggedLevel = data.level || 0;
      if (draggedListId !== listId) {
        if (draggedLevel !== 0) {
          alert('Only top-level tasks can be moved to different lists');
          return;
        }
      }

      // Make it a child of this item (only within same list)
      await onUpdate(draggedItemId, { parent_id: item.id, list_id: listId });
      if (onItemMoved) {
        onItemMoved();
      }
    } catch (err) {
      console.error('Error handling drop on children:', err);
      alert(err.response?.data?.error || 'Error moving task');
    }
  };

  const countCompletedChildren = (children) => {
    if (!children || children.length === 0) return 0;
    return children.filter(child => child.completed).length;
  };

  const countTotalChildren = (children) => {
    if (!children || children.length === 0) return 0;
    return children.length;
  };

  const completedCount = countCompletedChildren(item.children);
  const totalCount = countTotalChildren(item.children);
  const hasChildren = item.children && item.children.length > 0;

  // Color coding based on level
  const getBorderColor = () => {
    if (level === 0) return '#4285F4'; // Blue
    if (level === 1) return '#34A853'; // Green
    return '#9C27B0'; // Purple
  };

  const getIndent = () => {
    return `${level * 32}px`;
  };

  const handleMoveToList = async (targetListId) => {
    if (targetListId === listId) {
      setShowMoveListDropdown(false);
      return;
    }

    try {
      await onUpdate(item.id, { list_id: targetListId, parent_id: null });
      setShowMoveListDropdown(false);
      if (onItemMoved) {
        onItemMoved(); // Refresh the parent list
      }
    } catch (err) {
      console.error('Error moving task to list:', err);
      alert(err.response?.data?.error || 'Error moving task');
    }
  };

  // Get available lists for moving (only show for top-level tasks)
  const availableLists = (lists && level === 0) ? lists.filter(l => l.id !== listId) : [];

  return (
    <div className="todo-item-wrapper" style={{ marginLeft: getIndent() }}>
      <div 
        ref={cardRef}
        className={`todo-item-card ${isDragging ? 'dragging' : ''} ${dragOver ? 'drag-over' : ''} ${dragOverAsChild ? 'drag-over-child' : ''}`}
        style={{ borderLeftColor: getBorderColor() }}
        data-level={level}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="item-content">
          <div className="drag-handle">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="2" cy="2" r="1" fill="#9AA0A6"/>
              <circle cx="6" cy="2" r="1" fill="#9AA0A6"/>
              <circle cx="10" cy="2" r="1" fill="#9AA0A6"/>
              <circle cx="2" cy="6" r="1" fill="#9AA0A6"/>
              <circle cx="6" cy="6" r="1" fill="#9AA0A6"/>
              <circle cx="10" cy="6" r="1" fill="#9AA0A6"/>
              <circle cx="2" cy="10" r="1" fill="#9AA0A6"/>
              <circle cx="6" cy="10" r="1" fill="#9AA0A6"/>
              <circle cx="10" cy="10" r="1" fill="#9AA0A6"/>
            </svg>
          </div>

          {hasChildren && (
            <button 
              className="expand-button" 
              onClick={handleToggleExpand}
              aria-label={item.is_expanded ? 'Collapse' : 'Expand'}
            >
              {item.is_expanded ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}

          {!hasChildren && <div className="expand-spacer"></div>}

          <button 
            className="checkbox-button"
            onClick={handleToggleComplete}
            aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {item.completed ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="#34A853"/>
                <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#9AA0A6" strokeWidth="2"/>
              </svg>
            )}
          </button>

          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyPress}
              className="item-edit-input"
            />
          ) : (
            <span 
              className={`item-text ${item.completed ? 'completed' : ''}`}
              onDoubleClick={handleEdit}
            >
              {item.content}
            </span>
          )}

          {hasChildren && (
            <span className="completion-count">
              {completedCount}/{totalCount} completed
            </span>
          )}

          <div className="item-actions">
            {!isEditing && (
              <>
                {level < 2 && (
                  <button 
                    className="add-subtask-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSubItemForm(!showSubItemForm);
                    }}
                    title="Add subtask"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3V13M3 8H13" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
                
                <button 
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  title="Edit"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M11.333 2.00001C11.5084 1.82449 11.7163 1.68506 11.9447 1.58925C12.1731 1.49343 12.4173 1.44318 12.664 1.44135C12.9107 1.43951 13.1557 1.48612 13.3856 1.5784C13.6155 1.67068 13.8258 1.80673 14.004 1.97934C14.1822 2.15195 14.3248 2.35791 14.4237 2.58534C14.5227 2.81278 14.5761 3.05685 14.5807 3.30368C14.5853 3.55051 14.541 3.79458 14.4507 4.02447C14.3604 4.25436 14.2259 4.46553 14.0553 4.64534L5.528 13.1727L1.33333 14.6667L2.82733 10.472L11.333 2.00001Z" stroke="#5F6368" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {level === 0 && availableLists.length > 0 && (
                  <div className="move-list-container" ref={moveListDropdownRef}>
                    <button 
                      className="move-list-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoveListDropdown(!showMoveListDropdown);
                      }}
                      title="Move to another list"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8H14M10 4L14 8L10 12" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {showMoveListDropdown && (
                      <div className="move-list-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="move-list-dropdown-header">Move to List:</div>
                        {availableLists.map((targetList) => (
                          <button
                            key={targetList.id}
                            className="move-list-dropdown-item"
                            onClick={() => handleMoveToList(targetList.id)}
                          >
                            📋 {targetList.title}
                          </button>
                        ))}
                        <button
                          className="move-list-dropdown-cancel"
                          onClick={() => setShowMoveListDropdown(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {showSubItemForm && (
          <form onSubmit={handleCreateSubItem} className="sub-item-form">
            <input
              type="text"
              value={newSubItemContent}
              onChange={(e) => setNewSubItemContent(e.target.value)}
              placeholder="New subtask..."
              autoFocus
            />
            <button type="submit" className="submit-btn">Add</button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setShowSubItemForm(false)}
            >
              Cancel
            </button>
          </form>
        )}

        {/* Drop zone for children */}
        {item.is_expanded && level < 2 && (
          <div 
            className={`children-drop-zone ${dragOverAsChild ? 'active' : ''}`}
            onDragOver={handleChildrenDragOver}
            onDragLeave={handleChildrenDragLeave}
            onDrop={handleChildrenDrop}
          >
            {hasChildren && item.children.length === 0 && dragOverAsChild && (
              <div className="drop-zone-indicator">Drop here to make it a subtask</div>
            )}
          </div>
        )}
      </div>

      {item.is_expanded && item.children && (
        // Render child items recursively (subtasks)
        <div className="children-container">
          {item.children.map((child) => (
            <TodoItem
              key={child.id}
              item={child}
              onUpdate={onUpdate}
              onDelete={onDelete}
              listId={listId}
              level={level + 1}
              lists={lists}
              onItemMoved={onItemMoved}
              allItems={allItems}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TodoItem;
