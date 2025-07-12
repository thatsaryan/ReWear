import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'user' | 'admin';
  points: number;
  level: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string, username: string, full_name: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      // Verify token and get user data
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Verify token and get user data
  const verifyToken = async (authToken: string) => {
    try {
      const response = await authAPI.getMe(authToken);
      setUser(response.user);
      setToken(authToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Token is invalid, clear it
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Set token in localStorage and update state
  const setAuthToken = (authToken: string) => {
    localStorage.setItem('authToken', authToken);
    setToken(authToken);
  };

  // Clear token from localStorage and update state
  const clearAuthToken = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(email, password);
      setUser(response.user);
      setAuthToken(response.token);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, confirmPassword: string, username: string, full_name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(email, password, confirmPassword, username, full_name);
      setUser(response.user);
      setAuthToken(response.token);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthToken();
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authAPI.forgotPassword(email);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Password reset request failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authAPI.resetPassword(token, newPassword, confirmPassword);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Password reset failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      await authAPI.changePassword(token, currentPassword, newPassword, confirmPassword);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Password change failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    clearError,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 