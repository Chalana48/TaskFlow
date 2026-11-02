import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Verify session on initial app mount by calling /api/auth/me
   */
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
      } else {
        setUser(null);
      }
      setAuthError(null);
    } catch {
      // 401 or network failure simply means not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * User Registration
   */
  const register = async ({ name, username, email, password }) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/register', {
        name,
        username,
        email,
        password,
      });

      if (res.data?.token) {
        localStorage.setItem('taskflow_token', res.data.token);
      }

      setUser(res.data.data);
      return { success: true, user: res.data.data };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  /**
   * User Login
   */
  const login = async ({ email, password }) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
      });

      if (res.data?.token) {
        localStorage.setItem('taskflow_token', res.data.token);
      }

      setUser(res.data.data);
      return { success: true, user: res.data.data };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  /**
   * User Logout
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      localStorage.removeItem('taskflow_token');
      setUser(null);
      setAuthError(null);
    }
  };

  /**
   * Update Profile Details
   */
  const updateProfile = async ({ name, username, profileImage }) => {
    try {
      const res = await api.put('/users/profile', {
        name,
        username,
        profileImage,
      });
      setUser(res.data.data);
      return { success: true, user: res.data.data, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  /**
   * Change Password
   */
  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      const res = await api.put('/users/password', {
        currentPassword,
        newPassword,
      });
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
