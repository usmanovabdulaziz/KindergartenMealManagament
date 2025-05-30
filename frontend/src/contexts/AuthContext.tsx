
import React, { createContext, useContext, ReactNode } from 'react';
import { useApiService } from '@/hooks/useApiService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  userRole: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, userRole, login, logout, refreshUserProfile } = useApiService();

  const value = {
    isAuthenticated,
    user,
    userRole,
    login,
    logout,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};