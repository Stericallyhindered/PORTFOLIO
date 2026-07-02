import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SocketEvents } from '../types';

// Socket Context Interface
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

// Create Context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Socket Provider Props
interface SocketProviderProps {
  children: ReactNode;
}

// Socket Provider Component
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { state } = useAuth();

  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      // Initialize socket connection
      const newSocket = io('/', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Join user-specific room
        newSocket.emit('join-room', `user-${state.user!.id}`);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('reconnect', () => {
        console.log('Socket reconnected');
        setIsConnected(true);
        newSocket.emit('join-room', `user-${state.user!.id}`);
      });

      setSocket(newSocket);

      // Cleanup on unmount or auth change
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Disconnect socket if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [state.isAuthenticated, state.user?.id]);

  // Emit function
  const emit = (event: string, data: any): void => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  // On function
  const on = (event: string, callback: (data: any) => void): void => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  // Off function
  const off = (event: string, callback?: (data: any) => void): void => {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  };

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Custom hook for specific socket events
export const useSocketEvent = <T extends keyof SocketEvents>(
  event: T,
  callback: (data: SocketEvents[T]) => void,
  deps: React.DependencyList = []
): void => {
  const { on, off } = useSocket();

  useEffect(() => {
    on(event, callback);
    return () => off(event, callback);
  }, [event, on, off, ...deps]);
};

export default SocketContext;
