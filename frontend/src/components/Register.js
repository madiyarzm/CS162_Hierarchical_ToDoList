// Register form component
// - Props: setIsAuthenticated(callback) to update app auth state after success
// - Creates a new user then logs them in and redirects to the tasks view
import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

function Register({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Send registration data to backend. On success, automatically log in.
    try {
      await axios.post('/api/register', { username, password });
      const loginResponse = await axios.post('/api/login', { username, password });
      if (loginResponse.data.message) {
        setIsAuthenticated(true);
        history.push('/todos');
      }
    } catch (err) {
      setError('Username already exists');
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
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
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account?{' '}
        <span onClick={() => history.push('/login')} className="link">
          Login
        </span>
      </p>
    </div>
  );
}

export default Register;