# Hierarchical Todo List App

A full-stack web application that allows users to create, manage, and organize hierarchical todo lists with up to 3 levels of nesting.

# Link to the Demo
https://www.loom.com/share/91ddb50260924a10ad1223092ac8a5bc

## Features

### Core Functionality
- **User Authentication**: Secure user registration and login system
- **Multiple Lists**: Create and manage multiple todo lists
- **Hierarchical Tasks**: Create tasks with subtasks (up to 3 levels deep)
- **Task Management**:
  - Create, edit, and delete tasks
  - Mark tasks as complete/incomplete
  - Expand/collapse tasks to hide/show subtasks
  - Move top-level tasks between lists (via move button)
  - Drag-and-drop reorganization within the same list
- **Visual Hierarchy**: Color-coded borders (blue, green, purple) indicate task levels
- **Completion Tracking**: See completion counts for parent tasks (e.g., "2/3 completed")
- **Inline Editing**: Double-click or use edit button to modify task names

### User Interface
- Modern, card-based design with clean styling
- Responsive layout with smooth transitions
- Intuitive drag handles and expand/collapse icons
- Visual completion indicators with checkmarks
- Dashboard and Preview tabs for list management

## Project Structure

```
CS162_Hierarchical_ToDoList/
├── backend/
│   ├── app.py                 # Flask backend API
│   ├── requirements.txt       # Python dependencies
│   ├── todo.db               # SQLite database (created on first run)
│   └── venv/                  # Virtual environment (excluded from submission)
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js             # Main React app component with routing
│   │   ├── App.css            # Global styles
│   │   ├── index.js           # React entry point
│   │   └── components/
│   │       ├── Login.js       # Login component
│   │       ├── Register.js    # Registration component
│   │       ├── TodoApp.js     # Main todo app with Dashboard/Preview tabs
│   │       ├── TodoList.js    # List component displaying tasks
│   │       └── TodoItem.js    # Individual task item component (recursive)
│   ├── package.json
│   └── package-lock.json
└── README.md                  # This file
```

## Installation

### Prerequisites
- Python 3.7+ 
- Node.js 14+ and npm
- Git (optional, for cloning)

### Backend Setup (Flask)

**macOS/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
python3 app.py
```

**Windows:**
```bash
cd backend
python3 -m venv venv
venv\Scripts\activate.bat
pip3 install -r requirements.txt
python3 app.py
```

The backend will run on `http://localhost:5000` by default.

### Frontend Setup (React)

**All Platforms:**
```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000` by default.

**Note:** The frontend proxy is configured to forward API requests to `http://localhost:5000` (see `frontend/package.json`).

## Usage

1. **Register/Login**: 
   - Navigate to the login page
   - Click "Register" to create a new account or login with existing credentials

2. **Create Lists**:
   - Go to the Dashboard tab
   - Enter a list name and click "Create List"
   - The app will automatically switch to Preview tab

3. **Create Tasks**:
   - On the Preview tab, click "Add task" button (or the form will auto-appear if the list is empty)
   - Enter task name and click "Add"

4. **Add Subtasks**:
   - Hover over a task to reveal action buttons
   - Click the "+" button to add a subtask
   - Repeat for up to 3 levels deep

5. **Manage Tasks**:
   - **Edit**: Double-click task name or click the pencil icon (✏️)
   - **Complete**: Click the checkbox to mark tasks as complete
   - **Expand/Collapse**: Click the chevron icon (▼/▶) to hide/show subtasks
   - **Move Between Lists**: Click the arrow icon (→) on top-level tasks to move them to another list
   - **Reorganize**: Drag and drop tasks within the same list to change hierarchy
   - **Delete**: Click the X icon (✕) to delete tasks

6. **View Progress**:
   - Parent tasks show completion counts (e.g., "2/3 completed")
   - Completed tasks are crossed out

## Technology Stack

### Backend Technologies

**Flask** (`backend/app.py`)
- **Purpose**: Python web framework providing RESTful API endpoints
- **Used for**: HTTP request handling, routing, middleware

**Flask-SQLAlchemy** (`backend/app.py`)
- **Purpose**: Object-Relational Mapping (ORM) library
- **Used for**: Database models (User, TodoList, TodoItem), database queries, relationships

**Flask-Login** (`backend/app.py`)
- **Purpose**: User session management
- **Used for**: 
  - User authentication state
  - Session cookies
  - `@login_required` decorator to protect routes
  - `current_user` to access logged-in user

**Flask-Bcrypt** (`backend/app.py`)
- **Purpose**: Password hashing
- **Used for**: Securely hashing passwords on registration, verifying passwords on login

**Flask-CORS** (`backend/app.py`)
- **Purpose**: Cross-Origin Resource Sharing
- **Used for**: Allowing frontend (localhost:3000) to make requests to backend (localhost:5000)

**SQLite** (`backend/todo.db`)
- **Purpose**: Relational database
- **Used for**: Persistent storage of users, lists, and tasks
- **Location**: Created automatically on first run as `todo.db`

### Frontend Technologies

**React** (`frontend/src/`)
- **Purpose**: JavaScript UI library for building interactive user interfaces
- **Used for**: Component-based architecture, state management, UI rendering

**React Router** (`frontend/src/App.js`)
- **Purpose**: Client-side routing
- **Used for**: Navigation between Login, Register, and Todos pages

**Axios** (`frontend/src/components/`)
- **Purpose**: HTTP client library
- **Used for**: Making API requests to backend (GET, POST, PUT, DELETE)

### Design Patterns

**Component Architecture**:
- Functional React components with hooks (useState, useEffect, useRef)
- Recursive component structure (TodoItem renders itself for children)

**State Management**:
- Local component state with React hooks
- Props for passing data between components
- API calls to fetch/update data from backend

**Authentication Flow**:
- Frontend maintains `isAuthenticated` state
- Backend uses session-based auth with Flask-Login
- Protected routes check authentication before rendering

## MVP Requirements Checklist

✅ **1. Multiple Users**: Each user only sees their own tasks  
- **Implementation**: Backend filters all queries by `user_id` using `current_user.id`
- **Location**: `backend/app.py` - all routes use `TodoList.query.filter_by(user_id=current_user.id)`

✅ **2. User Isolation**: Users cannot modify other users' tasks  
- **Implementation**: All PUT/DELETE operations join with TodoList and filter by `current_user.id`
- **Location**: `backend/app.py` lines 159-161, 177-179, 190-192

✅ **3. Forgot Password**: Not required (intentionally not implemented)

✅ **4. Task Completion**: Users can mark tasks as complete  
- **Implementation**: Checkbox updates `completed` field via PUT request
- **Location**: `frontend/src/components/TodoItem.js` - `handleToggleComplete()`

✅ **5. Collapse/Expand**: Users can hide/show subtasks  
- **Implementation**: Toggle `is_expanded` field, conditionally render children
- **Location**: `frontend/src/components/TodoItem.js` - `handleToggleExpand()` and conditional rendering

✅ **6. Move Top-Level Tasks**: Top-level tasks can be moved between lists  
- **Implementation**: Move button (→) on top-level tasks opens dropdown with available lists
- **Location**: `frontend/src/components/TodoItem.js` - `handleMoveToList()` (only shown when `level === 0`)
- **Note**: Only top-level tasks (level 0) can move between lists, as per MVP requirements

✅ **7. Persistent Storage**: Data saved in SQLite database  
- **Implementation**: SQLAlchemy ORM with SQLite database
- **Location**: `backend/app.py` - all models and CRUD operations persist to `todo.db`

## Additional Features (Beyond MVP)

- **Inline Editing**: Double-click or edit button to modify task names
- **Drag-and-Drop**: Reorganize tasks within the same list by dragging
- **Visual Hierarchy**: Color-coded borders (blue=level 0, green=level 1, purple=level 2)
- **Completion Tracking**: Parent tasks show "X/Y completed" counts
- **Auto-expand**: Tasks expanded by default to show all items

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
  - **Body**: `{ username: string, password: string }`
  - **Response**: `{ message: "User created successfully" }` or `{ error: string }`

- `POST /api/login` - Login user
  - **Body**: `{ username: string, password: string }`
  - **Response**: `{ message: "Logged in successfully" }` or `{ error: string }`
  - **Sets**: Session cookie for authentication

### Lists (All require authentication)
- `GET /api/lists` - Get all lists for current user
  - **Response**: `[{ id: number, title: string }, ...]`

- `POST /api/lists` - Create a new list
  - **Body**: `{ title: string }`
  - **Response**: `{ id: number, title: string }`

### Items (All require authentication)
- `GET /api/lists/<list_id>/items` - Get all top-level items in a list
  - **Response**: Recursive structure with children nested

- `POST /api/lists/<list_id>/items` - Create a new item
  - **Body**: `{ content: string, parent_id: number (optional) }`
  - **Response**: `{ id: number, content: string, completed: boolean, is_expanded: boolean }`

- `PUT /api/items/<item_id>` - Update an item
  - **Body**: `{ content?: string, completed?: boolean, is_expanded?: boolean, list_id?: number, parent_id?: number | null }`
  - **Response**: `{ message: "Item updated successfully" }`

- `DELETE /api/items/<item_id>` - Delete an item
  - **Response**: `{ message: "Item deleted successfully" }`

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt (one-way encryption)
- **Session Management**: Flask-Login manages user sessions securely
- **Route Protection**: All API endpoints (except register/login) require `@login_required`
- **User Isolation**: All queries filter by `current_user.id` to prevent cross-user access
- **SQL Injection Protection**: SQLAlchemy ORM uses parameterized queries
- **CORS Configuration**: Configured to allow only frontend origin

## Design Decisions

1. **3-Level Limit**: The hierarchy is limited to 3 levels (task → subtask → sub-subtask) for better UX and to match assignment requirements
   - **Enforced**: Frontend prevents creating subtasks beyond level 2

2. **Card-Based Design**: Tasks are displayed as cards with color-coded borders to visually distinguish hierarchy levels
   - Blue border = Level 0 (top-level tasks)
   - Green border = Level 1 (subtasks)
   - Purple border = Level 2 (sub-subtasks)

3. **Auto-Expand**: Tasks are expanded by default (`is_expanded=True`) to show users all their tasks immediately

4. **Move Restriction**: Only top-level tasks can be moved between lists (as per MVP requirements)
   - **Implementation**: Move button only appears when `level === 0`
   - **UI**: Arrow icon (→) visible on hover for top-level tasks only

5. **Drag-and-Drop**: Enabled for reorganizing within the same list (not for moving between lists)

6. **Inline Editing**: Tasks can be edited by double-clicking or using the edit button
   - **UX**: Auto-focus and text selection for quick editing
   - **Keyboard**: Enter to save, Escape to cancel


## Troubleshooting

**Backend won't start:**
- Ensure virtual environment is activated: `source venv/bin/activate` (macOS/Linux) or `venv\Scripts\activate.bat` (Windows)
- Check that all dependencies are installed: `pip3 install -r requirements.txt`
- Verify Python 3.7+ is installed: `python3 --version`
- Check if port 5000 is already in use

**Frontend won't start:**
- Ensure Node.js is installed: `node --version` (should be 14+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that backend is running on port 5000
- Verify no other process is using port 3000

**Database issues:**
- Delete `todo.db` to reset the database (all data will be lost)
- The database is automatically created on first run
- If schema changes, delete `todo.db` and restart the backend

**CORS errors:**
- Ensure backend is running before starting frontend
- Verify backend has CORS enabled (configured in `app.py` line 17)
- Check browser console for specific CORS error messages

**Authentication issues:**
- Clear browser cookies if login seems broken
- Ensure backend session secret is consistent (currently hardcoded)
- Check browser console for API error responses

**Drag-and-drop not working:**
- Ensure you're dragging within the same list (for reorganization)
- To move between lists, use the move button (→) on top-level tasks
- Check browser console for JavaScript errors

## Code Comments

The codebase includes comments explaining:
- Component purposes and functionality
- Complex logic (drag-and-drop handlers, recursive rendering)
- Security measures (user isolation, authentication)
- API endpoint behaviors

## License

This project is for educational purposes as part of CS162 coursework.

## Author

Madiyar Zhunussov
