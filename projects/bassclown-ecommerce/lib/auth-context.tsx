'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Session } from 'next-auth';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();

  const user: User | null = session?.user ? {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    role: session.user.role || 'member',
    joinDate: new Date().toISOString(), // In a real app, this would come from the database
    avatar: session.user.image || undefined,
  } : null;

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });
      
      return !result?.error;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    signOut({ callbackUrl: '/' });
  };

  const updateUser = (updates: Partial<User>) => {
    // In a real app, this would update the user in the database
    // For now, we'll just log the update
    console.log('User update requested:', updates);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!session,
    login,
    logout,
    updateUser,
    isLoading: status === 'loading',
    session,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 