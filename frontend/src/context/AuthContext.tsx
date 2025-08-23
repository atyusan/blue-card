import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { User, LoginFormData } from '../types';
import { authService, type LoginResponse } from '../services/auth.service';

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
}

// Auth action types
type AuthAction =
  | { type: 'AUTH_START' }
  | {
      type: 'AUTH_SUCCESS';
      payload: { user: User; token: string };
    }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'TOKEN_REFRESH_START' }
  | {
      type: 'TOKEN_REFRESH_SUCCESS';
      payload: { token: string };
    }
  | { type: 'TOKEN_REFRESH_FAILURE' }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial auth state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isRefreshing: false,
};

// Auth reducer
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
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: null, // No longer stored in state
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isRefreshing: false,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isRefreshing: false,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isRefreshing: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'TOKEN_REFRESH_START':
      return {
        ...state,
        isRefreshing: true,
        error: null,
      };

    case 'TOKEN_REFRESH_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        isRefreshing: false,
        error: null,
      };

    case 'TOKEN_REFRESH_FAILURE':
      return {
        ...state,
        isRefreshing: false,
        error: 'Token refresh failed. Please login again.',
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// Auth context interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
  hasRole: (role: string) => boolean;
  hasPermission: (action: string) => boolean;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        const token = authService.getStoredToken();
        const user = authService.getStoredUser();

        if (token && user && !authService.isTokenExpired(token)) {
          // Token is valid, restore session
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token },
          });
        } else if (user && token && authService.isTokenExpired(token)) {
          // Token expired, redirect to login since no refresh token
          await authService.logout();
          dispatch({ type: 'AUTH_LOGOUT' });
        } else {
          // No valid tokens, clear storage
          await authService.logout();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch({ type: 'AUTH_LOGOUT' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.isAuthenticated || !state.token) return;

    const refreshInterval = setInterval(async () => {
      try {
        if (state.token && authService.isTokenExpired(state.token)) {
          // Token expired, redirect to login since no refresh token
          await logout();
        }
      } catch (error) {
        console.error('Token check failed:', error);
        await logout();
      }
    }, 4 * 60 * 1000); // Check every 4 minutes

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, state.token]);

  // Login function
  const login = async (credentials: LoginFormData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response: LoginResponse = await authService.login(credentials);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Update user function
  const updateUser = (user: User): void => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    return authService.hasRole(role);
  };

  // Check if user has permission for specific action
  const hasPermission = (action: string): boolean => {
    return authService.hasPermission(action);
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    updateUser,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
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
