import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, getStoredUser, setAuth, clearAuth, isAuthenticated } from '../utils/auth';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    setAuth(result.token, result.user);
    setUser(result.user);
    return result;
  }, []);

  const completeVerification = useCallback((result) => {
    setAuth(result.token, result.user);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  const value = {
    user,
    loading,
    isLoggedIn: isAuthenticated() && Boolean(user),
    isAdmin,
    login,
    completeVerification,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
