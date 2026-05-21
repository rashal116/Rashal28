import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MiningState } from '../types';

interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface SimContextType {
  currentUserId: string;
  user: User | null;
  mining: MiningState | null;
  notificationsCount: number;
  activeTab: string;
  vpnShieldEnabled: boolean;
  activeNotifications: NotificationAlert[];
  isLoading: boolean;
  setUserId: (id: string) => void;
  setActiveTab: (tab: string) => void;
  setVpnShieldEnabled: (val: boolean) => void;
  refreshUserData: () => Promise<void>;
  triggerNotification: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  dismissNotification: (id: string) => void;
  demoLogin: (telegramId: string, username: string, firstName: string, lastName: string, referCode?: string) => Promise<User | null>;
}

const SimContext = createContext<SimContextType | undefined>(undefined);

export const SimProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string>('user_demo'); // default simulated user
  const [user, setUser] = useState<User | null>(null);
  const [mining, setMining] = useState<MiningState | null>(null);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [vpnShieldEnabled, setVpnShieldEnabled] = useState<boolean>(false);
  const [activeNotifications, setActiveNotifications] = useState<NotificationAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const triggerNotification = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `noti_${Date.now()}`;
    const newAlert: NotificationAlert = { id, title, message, type };
    setActiveNotifications(prev => [newAlert, ...prev]);

    // auto dismiss
    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  const refreshUserData = async () => {
    if (!currentUserId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setMining(data.mining);
        setNotificationsCount(data.notificationsCount);
      } else {
        const errorData = await res.json();
        console.error("Error loading user profile:", errorData);
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserId = (id: string) => {
    setCurrentUserId(id);
  };

  const demoLogin = async (telegramId: string, username: string, firstName: string, lastName: string, referralCode?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          username,
          firstName,
          lastName,
          referralCode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.user.id);
        setUser(data.user);
        triggerNotification('Logged in successfully', `Welcome to Telegram Task Web App, @${data.user.username}!`, 'success');
        return data.user as User;
      } else {
        const err = await res.json();
        triggerNotification('Login failed', err.error || 'Server rejected request', 'error');
        return null;
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Connection Error', 'Failed to connect to simulation database.', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Run auto refresh profile on mount or user shift
  useEffect(() => {
    refreshUserData();
  }, [currentUserId]);

  // Simulated VPN protection scan check
  useEffect(() => {
    if (vpnShieldEnabled) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/security/check-vpn', { method: 'POST' });
          const data = await res.json();
          if (data.vpnDetected) {
            triggerNotification(
              'Security Alert 🛡️', 
              'Anti-Fraud Firewall detected a suspicious network route. VPN check triggered standard auto-verification bypass limits.', 
              'warning'
            );
          }
        } catch (e) {
          console.error(e);
        }
      }, 30000); // scan every 30 seconds
      return () => clearInterval(interval);
    }
  }, [vpnShieldEnabled]);

  return (
    <SimContext.Provider value={{
      currentUserId,
      user,
      mining,
      notificationsCount,
      activeTab,
      vpnShieldEnabled,
      activeNotifications,
      isLoading,
      setUserId,
      setActiveTab,
      setVpnShieldEnabled,
      refreshUserData,
      triggerNotification,
      dismissNotification,
      demoLogin
    }}>
      {children}
    </SimContext.Provider>
  );
};

export const useSim = () => {
  const context = useContext(SimContext);
  if (context === undefined) {
    throw new Error('useSim must be used within a SimProvider');
  }
  return context;
};
