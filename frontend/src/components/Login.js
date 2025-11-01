// Login form component
// - Props: setIsAuthenticated(callback) to update app auth state
// - Sends credentials to backend and redirects on success
// Login form component
// - Props: setIsAuthenticated(callback) to update app auth state after success
// - Small form with username/password fields; submits to the backend API
// - On success it marks the UI as logged in and navigates to the tasks page
import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    try {
      const response = await axios.post('/api/login', { username, password });
      // Only proceed if we got a successful response (status 200)
      if (response.status === 200 && response.data.message === 'Logged in successfully') {
        setIsAuthenticated(true);
        history.push('/todos');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password');
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account?{' '}
        <span onClick={() => history.push('/register')} className="link">
          Register
        </span>
      </p>
    </div>
  );
}

export default Login;