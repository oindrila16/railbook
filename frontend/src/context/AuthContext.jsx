import { useState, useCallback } from 'react';
import { getStoredUser, setAuth, clearAuth, isAuthenticated } from '../utils/auth';
import * as authService from '../services/authService';

import { AuthContext } from './authState';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const loading = false;

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
