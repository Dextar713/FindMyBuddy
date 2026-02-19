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
  setCurrentUser: (user: CurrentUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(null);
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
  }, []);

  const setCurrentUser = useCallback((user: CurrentUser | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUserState(null);
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, setCurrentUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
