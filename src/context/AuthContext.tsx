import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Notification, MfaChallengeResponse } from '../types';
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
  pendingMfaChallenge: MfaChallengeResponse | null;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearMfaChallenge: () => void;
  login: (login: string, password: string) => Promise<MfaChallengeResponse | void>;
  completeMfaLogin: (mfaChallengeToken: string, code: string, method?: 'totp' | 'recovery_code') => Promise<{ recoveryCodeUsed?: boolean; remainingRecoveryCodes?: number }>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, totpCode?: string, revokeOtherSessions?: boolean) => Promise<{ message: string; revokedOtherSessionsCount: number }>;
  recoverPassword: (emailOrUsername: string) => Promise<{ message: string; emailDeliveryConfigured: boolean; providerNote?: string }>;
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
  const [pendingMfaChallenge, setPendingMfaChallenge] = useState<MfaChallengeResponse | null>(null);

  const openAuthModal = () => {
    setPendingMfaChallenge(null);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => {
    setPendingMfaChallenge(null);
    setIsAuthModalOpen(false);
  };
  const clearMfaChallenge = () => setPendingMfaChallenge(null);

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
      const cachedUser = getActiveLocalUser();
      if (!token && !cachedUser) {
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
        err?.code === 'MFA_REQUIRED' ||
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

  useEffect(() => {
    // Automatically synchronize and restore any client-side created stories/chapters/characters
    // so that redeployments, updates or server restarts never lose writer/reader activity.
    api.syncClientHydration().catch(() => {});
  }, [user?.id]);

  const login = async (loginId: string, password: string): Promise<MfaChallengeResponse | void> => {
    const res = await api.login(loginId, password);
    if (res.mfaRequired === true) {
      // Password verified, MFA challenge required. Do NOT set user until MFA code is verified!
      setPendingMfaChallenge(res);
      return res;
    }
    setPendingMfaChallenge(null);
    setUser(res.user);
    await fetchNotifs();
  };

  const completeMfaLogin = async (
    mfaChallengeToken: string,
    code: string,
    method: 'totp' | 'recovery_code' = 'totp'
  ) => {
    const res = await api.verifyMfaLogin({ mfaChallengeToken, code, method });
    setPendingMfaChallenge(null);
    setUser(res.user);
    await fetchNotifs();
    return {
      recoveryCodeUsed: res.recoveryCodeUsed,
      remainingRecoveryCodes: res.remainingRecoveryCodes,
    };
  };

  const signup = async (data: SignupData) => {
    const res = await api.signup(data);
    setPendingMfaChallenge(null);
    setUser(res.user);
    await fetchNotifs();
  };

  const logout = async () => {
    await api.logout();
    setPendingMfaChallenge(null);
    setUser(null);
    setNotifications([]);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    totpCode?: string,
    revokeOtherSessions = true
  ) => {
    const res = await api.changePassword({
      currentPassword,
      newPassword,
      totpCode,
      revokeOtherSessions,
    });
    if (res.user) {
      setUser(res.user);
    }
    return {
      message: res.message,
      revokedOtherSessionsCount: res.revokedOtherSessionsCount,
    };
  };

  const recoverPassword = async (emailOrUsername: string) => {
    const res = await api.requestPasswordReset(emailOrUsername);
    return {
      message: res.message,
      emailDeliveryConfigured: res.emailDeliveryConfigured,
      providerNote: res.providerNote,
    };
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
      pendingMfaChallenge,
      openAuthModal,
      closeAuthModal,
      clearMfaChallenge,
      login,
      completeMfaLogin,
      signup,
      logout,
      updateProfile,
      changePassword,
      recoverPassword,
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
