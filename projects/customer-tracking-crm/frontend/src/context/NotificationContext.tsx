import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Notification } from '../types';
import apiClient from '../utils/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

// Notification State Interface
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

// Notification Actions
type NotificationAction =
  | { type: 'NOTIFICATIONS_LOADING' }
  | { type: 'NOTIFICATIONS_SUCCESS'; payload: Notification[] }
  | { type: 'NOTIFICATIONS_FAILURE'; payload: string }
  | { type: 'NOTIFICATION_ADD'; payload: Notification }
  | { type: 'NOTIFICATION_READ'; payload: number }
  | { type: 'NOTIFICATIONS_CLEAR' };

// Initial State
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Notification Reducer
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'NOTIFICATIONS_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'NOTIFICATIONS_SUCCESS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.is_read).length,
        isLoading: false,
        error: null,
      };
    case 'NOTIFICATIONS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'NOTIFICATION_ADD':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'NOTIFICATIONS_CLEAR':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    default:
      return state;
  }
};

// Notification Context Interface
interface NotificationContextType {
  state: NotificationState;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
}

// Create Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification Provider Props
interface NotificationProviderProps {
  children: ReactNode;
}

// Notification Provider Component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { socket, isConnected } = useSocket();
  const { state: authState } = useAuth();

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (authState.isAuthenticated) {
      loadNotifications();
    } else {
      dispatch({ type: 'NOTIFICATIONS_CLEAR' });
    }
  }, [authState.isAuthenticated]);

  // Set up socket event listeners
  useEffect(() => {
    if (socket && isConnected && authState.isAuthenticated) {
      // Listen for new notifications
      const handleNotification = (notification: Notification) => {
        dispatch({ type: 'NOTIFICATION_ADD', payload: notification });
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new window.Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: `notification-${notification.id}`,
          });
        }
      };

      // Listen for approval events
      const handleCompanySubmitted = (data: any) => {
        if (authState.user?.role === 'admin') {
          const notification: Notification = {
            id: Date.now(),
            user_id: authState.user.id,
            type: 'approval_request',
            title: 'Company Approval Required',
            message: `Company "${data.companyName}" has been submitted for approval by ${data.submittedBy.first_name} ${data.submittedBy.last_name}`,
            entity_type: 'company',
            entity_id: data.companyId,
            is_read: false,
            created_at: new Date().toISOString(),
          };
          dispatch({ type: 'NOTIFICATION_ADD', payload: notification });
        }
      };

      const handleContactSubmitted = (data: any) => {
        if (authState.user?.role === 'admin') {
          const notification: Notification = {
            id: Date.now(),
            user_id: authState.user.id,
            type: 'approval_request',
            title: 'Contact Approval Required',
            message: `Contact "${data.contactName}" has been submitted for approval by ${data.submittedBy.first_name} ${data.submittedBy.last_name}`,
            entity_type: 'contact',
            entity_id: data.contactId,
            is_read: false,
            created_at: new Date().toISOString(),
          };
          dispatch({ type: 'NOTIFICATION_ADD', payload: notification });
        }
      };

      const handleOrderSubmitted = (data: any) => {
        if (authState.user?.role === 'admin') {
          const notification: Notification = {
            id: Date.now(),
            user_id: authState.user.id,
            type: 'approval_request',
            title: 'Order Approval Required',
            message: `Order ${data.orderNumber} has been submitted for approval by ${data.submittedBy.first_name} ${data.submittedBy.last_name}`,
            entity_type: 'order',
            entity_id: data.orderId,
            is_read: false,
            created_at: new Date().toISOString(),
          };
          dispatch({ type: 'NOTIFICATION_ADD', payload: notification });
        }
      };

      // Listen for approval results
      const handleCompanyApproved = (data: any) => {
        if (authState.user?.id === data.companyId) {
          const notification: Notification = {
            id: Date.now(),
            user_id: authState.user.id,
            type: 'company_approved',
            title: 'Company Approved',
            message: `Your company "${data.companyName}" has been approved`,
            entity_type: 'company',
            entity_id: data.companyId,
            is_read: false,
            created_at: new Date().toISOString(),
          };
          dispatch({ type: 'NOTIFICATION_ADD', payload: notification });
        }
      };

      const handleOrderApproved = (data: any) => {
        if (authState.user?.id === data.orderId) {
          const notification: Notification = {
            id: Date.now(),
            user_id: authState.user.id,
            type: 'order_approved',
            title: 'Order Approved',
            message: `Your order ${data.orderNumber} has been approved`,
            entity_type: 'order',
            entity_id: data.orderId,
            is_read: false,
            created_at: new Date().toISOString(),
          };
          dispatch({ type: 'NOTIFICATION_ADD', payload: notification });
        }
      };

      // Register event listeners
      socket.on('notification', handleNotification);
      socket.on('company_submitted', handleCompanySubmitted);
      socket.on('contact_submitted', handleContactSubmitted);
      socket.on('order_submitted', handleOrderSubmitted);
      socket.on('company_approved', handleCompanyApproved);
      socket.on('order_approved', handleOrderApproved);

      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Cleanup
      return () => {
        socket.off('notification', handleNotification);
        socket.off('company_submitted', handleCompanySubmitted);
        socket.off('contact_submitted', handleContactSubmitted);
        socket.off('order_submitted', handleOrderSubmitted);
        socket.off('company_approved', handleCompanyApproved);
        socket.off('order_approved', handleOrderApproved);
      };
    }
  }, [socket, isConnected, authState.user]);

  // Load notifications function
  const loadNotifications = async (): Promise<void> => {
    try {
      dispatch({ type: 'NOTIFICATIONS_LOADING' });
      const notifications = await apiClient.getNotifications();
      dispatch({ type: 'NOTIFICATIONS_SUCCESS', payload: notifications });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load notifications';
      dispatch({ type: 'NOTIFICATIONS_FAILURE', payload: errorMessage });
    }
  };

  // Mark notification as read
  const markAsRead = async (id: number): Promise<void> => {
    try {
      await apiClient.markNotificationAsRead(id);
      dispatch({ type: 'NOTIFICATION_READ', payload: id });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<void> => {
    try {
      const unreadNotifications = state.notifications.filter(n => !n.is_read);
      await Promise.all(unreadNotifications.map(n => apiClient.markNotificationAsRead(n.id)));
      
      // Update state
      dispatch({
        type: 'NOTIFICATIONS_SUCCESS',
        payload: state.notifications.map(n => ({ ...n, is_read: true }))
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Clear notifications
  const clearNotifications = (): void => {
    dispatch({ type: 'NOTIFICATIONS_CLEAR' });
  };

  const contextValue: NotificationContextType = {
    state,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
