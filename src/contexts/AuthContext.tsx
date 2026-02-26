import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApp } from './AppContext';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, login: appLogin, logout: appLogout } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user session exists in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Note: We'd normally set the current user here, but since we're using mock data
        // we'll let the user log in through the form
      } catch (e) {
        console.error('Failed to parse saved user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await appLogin(email, password);
    // In a real app, we'd save the session token here
  };

  const logout = () => {
    appLogout();
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
