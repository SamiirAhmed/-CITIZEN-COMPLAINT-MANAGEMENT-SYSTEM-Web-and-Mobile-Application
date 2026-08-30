import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getStoredToken, getStoredUser, setSession } from '../services/apiClient';
import { isStaffUser, login as loginRequest, logout as logoutRequest } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUserState] = useState(() => {
    const stored = getStoredUser();
    return isStaffUser(stored) ? stored : null;
  });

  const setUser = useCallback((nextUser) => {
    if (!nextUser || !isStaffUser(nextUser)) {
      setUserState(null);
      return;
    }
    setUserState(nextUser);
    const currentToken = getStoredToken();
    if (currentToken) {
      setSession(currentToken, nextUser);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) return null;
    const response = await apiRequest('/auth/me');
    const nextUser = response?.data?.user;
    if (!isStaffUser(nextUser)) {
      logoutRequest();
      setToken(null);
      setUserState(null);
      return null;
    }
    setSession(getStoredToken(), nextUser);
    setUserState(nextUser);
    return nextUser;
  }, []);

  const applyUser = useCallback((nextUser) => {
    if (!isStaffUser(nextUser)) return;
    setSession(getStoredToken(), nextUser);
    setUserState(nextUser);
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshUser().catch(() => {
      // Keep cached session if offline; API client handles 401.
    });
  }, [token, refreshUser]);

  const login = useCallback(async (email, password) => {
    const result = await loginRequest(email, password);
    setToken(result.token);
    setUserState(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setToken(null);
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      setUser,
      isAuthenticated: Boolean(token && isStaffUser(user)),
      login,
      logout,
      refreshUser,
      applyUser,
    }),
    [token, user, setUser, login, logout, refreshUser, applyUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
