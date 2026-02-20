'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CurrentUser {
  id: string;
  userName: string;
  email: string;
  age?: number;
  description: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: CurrentUser | null;
  /** JWT for SignalR / cross-origin use; kept in memory only, not in localStorage */
  token: string | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'fyb_token';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const isLoggedIn = currentUser !== null;

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setCurrentUserState(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
      }
    }
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    if (storedToken) setTokenState(storedToken);
  }, []);

  const setCurrentUser = useCallback((user: CurrentUser | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  }, []);

  const logout = useCallback(() => {
    setCurrentUserState(null);
    setTokenState(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, token, setCurrentUser, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
