import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthUser, LoginForm } from '../types';
import apiClient from '../utils/api';

// Auth State Interface
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthUser }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Auth Context Interface
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = apiClient.getAuthToken();
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await apiClient.getCurrentUser();
          dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
        } catch (error) {
          console.error('Auth check failed:', error);
          apiClient.removeAuthToken();
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'No token found' });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginForm): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await apiClient.login(credentials);
      
      // Store token and user data
      apiClient.setAuthToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    apiClient.removeAuthToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.getCurrentUser();
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
