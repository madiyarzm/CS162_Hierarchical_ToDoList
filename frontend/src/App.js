// Top-level React component: routing and auth state
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import TodoApp from './components/TodoApp';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path="/login">
            {isAuthenticated ? (
              <Redirect to="/todos" />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )}
          </Route>
          <Route exact path="/register">
            {isAuthenticated ? (
              <Redirect to="/todos" />
            ) : (
              <Register setIsAuthenticated={setIsAuthenticated} />
            )}
          </Route>
          <Route exact path="/todos">
            {!isAuthenticated ? (
              <Redirect to="/login" />
            ) : (
              <TodoApp setIsAuthenticated={setIsAuthenticated} />
            )}
          </Route>
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;