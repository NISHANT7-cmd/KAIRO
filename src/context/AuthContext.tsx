import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { api, getStoredToken, getActiveLocalUser, ApiError } from '../services/api';

interface SignupData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  role?: 'USER' | 'WRITER';
  bio?: string;
  avatar?: string;
  favoriteGenres?: string[];
  favoriteThemes?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  notifications: Notification[];
  unreadNotifsCount: number;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (login: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const fetchNotifs = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (e) {
      setNotifications([]);
    }
  };

  const refreshUser = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setNotifications([]);
        return;
      }

      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
        await fetchNotifs();
      } else {
        // Explicitly empty response: clear session
        await api.logout();
        setUser(null);
        setNotifications([]);
      }
    } catch (err: any) {
      console.warn('[AuthContext] Session refresh encountered an error:', err);

      // Check specific response status codes:
      // 401 Unauthorized (invalid, missing, or expired token)
      // 403 Forbidden (suspended account)
      const isAuthRejection = 
        (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
        err?.status === 401 || 
        err?.status === 403 ||
        err?.code === 'EXPIRED_TOKEN' ||
        err?.code === 'INVALID_TOKEN' ||
        err?.code === 'MISSING_TOKEN' ||
        err?.code === 'ACCOUNT_SUSPENDED';

      if (isAuthRejection) {
        console.info('[AuthContext] Session credentials confirmed invalid by server. Logging out.');
        await api.logout();
        setUser(null);
        setNotifications([]);
      } else {
        // Transient serverless cold-start latency, 500/502/503/504, or network interruption
        console.warn('[AuthContext] Non-auth server/network error during refresh. Retaining local session cache.');
        const cachedUser = getActiveLocalUser();
        if (cachedUser) {
          setUser(cachedUser);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (loginId: string, password: string) => {
    const res = await api.login(loginId, password);
    setUser(res.user);
    await fetchNotifs();
  };

  const signup = async (data: SignupData) => {
    const res = await api.signup(data);
    setUser(res.user);
    await fetchNotifs();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setNotifications([]);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  const markNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      notifications,
      unreadNotifsCount,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      login,
      signup,
      logout,
      updateProfile,
      markNotificationRead,
      markAllNotificationsRead,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
