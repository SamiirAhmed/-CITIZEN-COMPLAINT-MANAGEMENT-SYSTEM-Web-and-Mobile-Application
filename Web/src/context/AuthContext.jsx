import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getStoredToken, getStoredUser, setSession } from '../services/apiClient';
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
    }),
    [token, user, setUser, login, logout]
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
