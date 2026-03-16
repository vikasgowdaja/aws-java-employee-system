import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('auth_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('auth_username'));
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('auth_display_name'));

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_username');
    const name = localStorage.getItem('auth_display_name');
    setAuthToken(token);
    setUsername(user);
    setDisplayName(name);
  }, []);

  const login = useCallback((token, user, name) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_username', user);
    localStorage.setItem('auth_display_name', name || user);
    setAuthToken(token);
    setUsername(user);
    setDisplayName(name || user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_display_name');
    setAuthToken(null);
    setUsername(null);
    setDisplayName(null);
  }, []);

  const value = {
    isAuthenticated: Boolean(authToken),
    authToken,
    username,
    displayName,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
