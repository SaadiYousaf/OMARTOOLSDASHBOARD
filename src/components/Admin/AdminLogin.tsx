// components/Admin/AdminLogin.tsx
import React, { useState } from 'react';
import { FiLock, FiMail, FiAlertCircle } from 'react-icons/fi';
import './AdminLogin.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 
interface AdminLoginProps {
  onLoginSuccess: () => void;
}

interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    // Note: role is not in the user object, it's in the token
  };
  errors?: string[];
}

// Function to decode JWT token
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT token:', e);
    return null;
  }
};

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch( `${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0] || 'Login failed');
      }

      // Extract role from JWT token
      const tokenPayload = parseJwt(data.token);
      const userRole = tokenPayload?.role;
      
      console.log('Token payload:', tokenPayload);
      console.log('User role:', userRole);
      
      // Check if user has admin role (case-insensitive)
      if (!userRole || (userRole.toLowerCase() !== 'admin' && userRole.toLowerCase() !== 'superadmin')) {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Store token and user data
      localStorage.setItem('adminToken', data.token);
      
      // Create user object with role from token
      const userWithRole = {
        ...data.user,
        role: userRole
      };
      localStorage.setItem('adminUser', JSON.stringify(userWithRole));
      
      // Call the success callback
      onLoginSuccess();
    } catch (err) {
      // Handle the unknown error type safely
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="login-header">
          <h1>Admin Dashboard</h1>
          <p>Please sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-message">
              <FiAlertCircle /> {error}
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor="email">Email</label>
            <div className="admin-input-with-icon">
              <FiMail />
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Password</label>
            <div className="admin-input-with-icon">
              <FiLock />
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        {/* Debug information - remove in production */}
        <div style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
          <p>Try logging in with:</p>
          <p>Your Credentials</p>
          <p>Role: SuperAdmin</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;