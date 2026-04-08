import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('career_shield_token'));

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    });
    if (response.data.success) {
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('career_shield_token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    }
    return { success: false, message: response.data.message };
  };

  const signup = async (email, password, fullName, company, department, role) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
      email,
      password,
      fullName,
      company,
      department,
      role,
    });
    if (response.data.success) {
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('career_shield_token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    }
    return { success: false, message: response.data.message };
  };

  const logout = () => {
    localStorage.removeItem('career_shield_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, updates, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.success) {
      setUser(response.data.user);
      return { success: true };
    }
    return { success: false, message: response.data.message };
  };

  const getAuthHeader = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        getAuthHeader,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
