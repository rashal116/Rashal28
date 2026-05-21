import React, { useState, useEffect } from 'react';
import { useSim } from './SimContext';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Settings, 
  Bell, 
  Users, 
  UserX, 
  CheckCircle,
  HelpCircle,
  Cpu,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';
import { SystemNotification } from '../types';

export const Header: React.FC = () => {
  const { 
    user, 
    currentUserId, 
    setUserId, 
    refreshUserData, 
    triggerNotification, 
    notificationsCount,
    vpnShieldEnabled,
    setVpnShieldEnabled,
    demoLogin
  } = useSim();

  const [simDrawerOpen, setSimDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dbNotifications, setDbNotifications] = useState<SystemNotification[]>([]);
  
  // Custom login forms
  const [tgIdInput, setTgIdInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [refInput, setRefInput] = useState('');
  
  // Speed ping
  const [pingMs, setPingMs] = useState(24);

  useEffect(() => {
    // fluctuate ping for micro-animations realism
    const interval = setInterval(() => {
      setPingMs(Math.floor(15 + Math.random() * 20));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-id': currentUserId }
      });
      if (res.ok) {
        const data = await res.json();
        setDbNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (notificationsOpen) {
      loadNotifications();
    }
  }, [notificationsOpen, notificationsCount]);

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'x-user-id': currentUserId }
      });
      refreshUserData();
      loadNotifications();
      triggerNotification('Inbox Cleared', 'All notifications marked as read', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgIdInput.trim() || !usernameInput.trim()) {
      triggerNotification('Input Error', 'ID and Username are required.', 'error');
      return;
    }
    const loggedInUser = await demoLogin(tgIdInput.trim(), usernameInput.trim(), 'Sim', 'Member', refInput.trim() ? refInput.trim() : undefined);
    if (loggedInUser) {
      setTgIdInput('');
      setUsernameInput('');
      setRefInput('');
      setSimDrawerOpen(false);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Telegram Profile Avatar & Welcome */}
        <div className="flex items-center space-x-3">
          <div className="relative cursor-pointer" onClick={() => setSimDrawerOpen(true)}>
            <img 
              referrerPolicy="no-referrer"
              src={user?.avatarUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&h=150&q=80"} 
              alt="Telegram Avatar" 
              className="w-10 h-10 rounded-full border-2 border-[#2481cc] object-cover hover:opacity-95 transition-all"
            />
            {user?.isVIP && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-900 shadow-sm" title="VIP Account">
                👑
              </span>
            )}
            <span className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-900" title="Telegram Online"></span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-semibold text-white truncate max-w-[120px]">
                {user ? `${user.firstName} ${user.lastName}` : "Connecting..."}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                Lvl {user?.level || 1}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono flex items-center">
              @{user?.username || "loading"}
              {user?.id === 'user_admin' && <span className="text-amber-400 text-[10px] ml-1 font-bold">[ADMIN]</span>}
            </span>
          </div>
        </div>

        {/* Action Panel Utilities */}
        <div className="flex items-center space-x-2">
          {/* VIP Label */}
          {user?.isVIP ? (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center">
              <Zap className="w-2.5 h-2.5 mr-1 text-amber-400 fill-amber-400" />
              VIP
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              Free
            </span>
          )}

          {/* Ping indicator */}
          <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline flex items-center bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
            <Globe className="w-2.5 h-2.5 mr-1" />
            {pingMs}ms
          </span>

          {/* Telegram simulation controls helper */}
          <button 
            id="simulation-control-btn"
            onClick={() => setSimDrawerOpen(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/80 relative"
            title="Simulator Controller"
          >
            <Settings className="w-4 h-4 text-[#2481cc]" />
            <span className="absolute -top-1 -left-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </button>

          {/* Notification Inbox Icon */}
          <button 
            id="notification-bell-btn"
            onClick={() => setNotificationsOpen(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/80 relative"
            title="Inbox Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {notificationsCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* --- TELEGRAM MINI APP SIMULATOR DRAWER --- */}
      {simDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-center items-end sm:items-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center">
                <Cpu className="w-4 h-4 mr-2 text-[#2481cc]" />
                Mini App Simulator API
              </h3>
              <button 
                id="close-sim-drawer"
                onClick={() => setSimDrawerOpen(false)}
                className="text-slate-400 hover:text-white font-bold px-2 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed">
              Verify platform features under different user contexts instantly. Use referrals, VIP accounts, or access the admin panel immediately.
            </p>

            {/* Quick Switch Profiles */}
            <div className="space-y-2.5 mb-5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fast-Switch Mock Profiles</h4>
              
              {/* Kabir Ahmed */}
              <button 
                id="profile-kabir-btn"
                onClick={() => { setUserId('user_demo'); setSimDrawerOpen(false); }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                  currentUserId === 'user_demo' 
                    ? 'bg-[#2481cc]/15 border-[#2481cc] text-white' 
                    : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">K</div>
                  <div>
                    <div className="text-xs font-semibold">Kabir Ahmed</div>
                    <div className="text-[10px] text-slate-500">Normal User • Balance: 120 BDT</div>
                  </div>
                </div>
                {currentUserId === 'user_demo' && <CheckCircle className="w-4 h-4 text-[#2481cc]" />}
              </button>

              {/* Sajib Hasan */}
              <button 
                id="profile-sajib-btn"
                onClick={() => { setUserId('user_active'); setSimDrawerOpen(false); }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                  currentUserId === 'user_active' 
                    ? 'bg-[#2481cc]/15 border-[#2481cc] text-white' 
                    : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-xs font-mono">S</div>
                  <div>
                    <div className="text-xs font-semibold">Sajib Hasan</div>
                    <div className="text-[10px] text-slate-500">Silver Earner • Balance: 850 BDT</div>
                  </div>
                </div>
                {currentUserId === 'user_active' && <CheckCircle className="w-4 h-4 text-[#2481cc]" />}
              </button>

              {/* Administrator */}
              <button 
                id="profile-admin-btn"
                onClick={() => { setUserId('user_admin'); setSimDrawerOpen(false); }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                  currentUserId === 'user_admin' 
                    ? 'bg-amber-500/10 border-amber-500 text-white' 
                    : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center font-bold text-xs">👑</div>
                  <div>
                    <div className="text-xs font-semibold flex items-center text-amber-400 font-sans">
                      Super Administrator 
                    </div>
                    <div className="text-[10px] text-slate-500">Main Admin Controls • VIP Status</div>
                  </div>
                </div>
                {currentUserId === 'user_admin' && <CheckCircle className="w-4 h-4 text-amber-500" />}
              </button>
            </div>

            {/* Custom Telegram Member Sign-Up */}
            <form onSubmit={handleCustomLoginSubmit} className="border-t border-slate-800 pt-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Simulate New Register Sync</h4>
              
              <div className="flex space-x-2">
                <input 
                  id="reg-tg-id"
                  type="text" 
                  placeholder="Telegram ID, e.g. 5928372"
                  value={tgIdInput}
                  onChange={(e) => setTgIdInput(e.target.value)}
                  className="w-1/2 bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-[#2481cc]"
                />
                <input 
                  id="reg-tg-username"
                  type="text" 
                  placeholder="Username, e.g. rx_king"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-1/2 bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div>
                <input 
                  id="reg-ref-code"
                  type="text" 
                  placeholder="Optional Referral Link Code, e.g. KABIR50"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <button 
                id="reg-submit-btn"
                type="submit"
                className="w-full bg-[#2481cc] hover:bg-[#1a66a3] active:bg-[#134d7c] text-white py-1.5 rounded text-xs font-semibold flex items-center justify-center transition-all"
              >
                <Users className="w-3.5 h-3.5 mr-1" />
                Trigger Telegram Sync Link
              </button>
            </form>

            <div className="border-t border-slate-800 mt-4 pt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center">
                <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" />
                Anti-VPN Shield Firewall:
              </span>
              <button
                id="toggle-vpn-shield"
                onClick={() => {
                  setVpnShieldEnabled(!vpnShieldEnabled);
                  triggerNotification(
                    vpnShieldEnabled ? 'Shield Inactive' : 'Shield Activated', 
                    vpnShieldEnabled ? 'Mock anti VPN scanner is now offline.' : 'Active threat scan and spoof protection online.', 
                    vpnShieldEnabled ? 'warning' : 'success'
                  );
                }}
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  vpnShieldEnabled ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                {vpnShieldEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- NOTIFICATIONS INBOX OVERLAY DRAWER --- */}
      {notificationsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-center items-end sm:items-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center">
                <Bell className="w-4 h-4 mr-2 text-[#2481cc]" />
                User Inbox Notification Core
              </h3>
              <button 
                id="close-notifications-drawer"
                onClick={() => setNotificationsOpen(false)}
                className="text-slate-400 hover:text-white font-bold px-2 text-sm"
              >
                ✕
              </button>
            </div>

            {dbNotifications.length > 0 && (
              <div className="flex justify-between mb-3">
                <span className="text-xs text-slate-400">Total: {dbNotifications.length} alerts</span>
                <button 
                  id="mark-read-btn"
                  onClick={markAllNotificationsRead} 
                  className="text-xs text-[#2481cc] hover:underline"
                >
                  Mark all read
                </button>
              </div>
            )}

            {/* Notification list scroll */}
            <div className="overflow-y-auto flex-1 space-y-2 text-white pr-1">
              {dbNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">Inbox is empty</p>
                  <p className="text-xs text-slate-500">When you complete tasks, or withdraw funds, dynamic logs show here.</p>
                </div>
              ) : (
                dbNotifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-3 rounded-lg border text-left ${
                      n.read 
                        ? 'bg-slate-950/30 border-slate-800/80 text-slate-400' 
                        : 'bg-slate-950 border-slate-700/60 shadow-md text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center">
                        {n.type === 'task_approved' && '✔️ '}
                        {n.type === 'task_rejected' && '❌ '}
                        {n.type === 'withdraw_success' && '💰 '}
                        {n.type === 'bonus_alert' && '🎁 '}
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            <button 
              id="close-notifications-action"
              onClick={() => setNotificationsOpen(false)}
              className="mt-4 w-full bg-slate-800 text-slate-300 hover:text-white py-2 rounded text-xs font-semibold"
            >
              Back to Telegram Mini App
            </button>

          </div>
        </div>
      )}

    </header>
  );
};
