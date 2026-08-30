<<<<<<< HEAD
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getStoredToken, getStoredUser, setSession } from '../services/apiClient';
=======
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getStoredToken, getStoredUser, setSession } from '../services/apiClient';
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
import { isStaffUser, login as loginRequest, logout as logoutRequest } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUserState] = useState(() => {
    const stored = getStoredUser();
    return isStaffUser(stored) ? stored : null;
  });

<<<<<<< HEAD
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

=======
  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) return null;
    const response = await apiRequest('/auth/me');
    const nextUser = response?.data?.user;
    if (!isStaffUser(nextUser)) {
      logoutRequest();
      setToken(null);
      setUser(null);
      return null;
    }
    setSession(getStoredToken(), nextUser);
    setUser(nextUser);
    return nextUser;
  }, []);

  const applyUser = useCallback((nextUser) => {
    if (!isStaffUser(nextUser)) return;
    setSession(getStoredToken(), nextUser);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshUser().catch(() => {
      // Keep cached session if offline; API client handles 401.
    });
  }, [token, refreshUser]);

>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
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
<<<<<<< HEAD
    [token, user, setUser, login, logout]
=======
    [token, user, login, logout, refreshUser, applyUser]
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
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
