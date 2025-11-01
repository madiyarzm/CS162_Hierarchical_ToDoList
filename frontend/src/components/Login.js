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
    try {
      const response = await axios.post('/api/login', { username, password });
      if (response.data.message) {
        setIsAuthenticated(true);
        history.push('/todos');
      }
    } catch (err) {
      setError('Invalid username or password');
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