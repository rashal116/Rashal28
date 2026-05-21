import React, { useState } from 'react';
import { useSim } from './SimContext';
import { 
  Award, 
  Gift, 
  Shield, 
  Activity, 
  ChevronRight, 
  Zap, 
  CheckCircle, 
  Mail, 
  Share2, 
  Laptop,
  HelpCircle
} from 'lucide-react';

export const ProfileTab: React.FC = () => {
  const { 
    user, 
    mining,
    currentUserId, 
    refreshUserData, 
    triggerNotification 
  } = useSim();

  // Gift codes input
  const [giftCode, setGiftCode] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [isUpgradingVip, setIsUpgradingVip] = useState<boolean>(false);

  // Claim code handler
  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode.trim()) return;

    setIsRedeeming(true);
    try {
      const res = await fetch('/api/user/claim-giftcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({ code: giftCode })
      });

      if (res.ok) {
        setGiftCode('');
        refreshUserData();
      } else {
        const err = await res.json();
        triggerNotification('Redeem Alert', err.error || 'Code invalid or already used.', 'warning');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRedeeming(false);
    }
  };

  // Buy VIP action
  const handleBuyVip = async () => {
    if (user?.isVIP) return;
    
    if (user && user.mainBalance < 250) {
      triggerNotification('FUNDS NEEDED', 'VIP upgrade requires 250 BDT on main balance. Move BDT cash or complete tasks!', 'warning');
      return;
    }

    setIsUpgradingVip(true);
    try {
      const res = await fetch('/api/user/buy-vip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        }
      });
      if (res.ok) {
        triggerNotification('VIP Unlocked! 👑', 'Welcome to the premium VIP network. Gold badge activated globally!', 'success');
        refreshUserData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpgradingVip(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto animate-in fade-in duration-200">
      
      {/* 1. COMPREHENSIVE PROFILE CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/20 border border-slate-800 p-4 rounded-xl shadow-md text-center relative overflow-hidden">
        
        {/* Profile badges */}
        <div className="absolute top-4 right-4">
          <span className="text-[10px] bg-[#2481cc]/10 border border-[#2481cc]/20 text-[#2481cc] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
            ID {user?.telegramId || '128372'}
          </span>
        </div>

        <div className="relative w-20 h-20 mx-auto mt-4 mb-3">
          <img 
            referrerPolicy="no-referrer"
            src={user?.avatarUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&h=150&q=80"} 
            alt="Profile Avatar" 
            className="w-full h-full rounded-full border-4 border-slate-800 object-cover shadow"
          />
          {user?.isVIP ? (
            <span className="absolute bottom-0 right-0 bg-yellow-500 border-2 border-slate-900 text-[10px] w-6 h-6 flex items-center justify-center rounded-full shadow">
              👑
            </span>
          ) : (
            <span className="absolute bottom-0 right-0 bg-[#2481cc] border-2 border-slate-900 text-[8px] font-black text-white px-1 py-0.2 rounded shadow uppercase font-mono">
              Lvl {user?.level}
            </span>
          )}
        </div>

        <h3 className="text-base font-black text-white">{user?.firstName} {user?.lastName}</h3>
        <span className="text-xs text-slate-500 font-mono">@{user?.username}</span>

        {/* Dynamic Rank displays with icon badge */}
        <div className="mt-4 inline-flex items-center space-x-1 bg-slate-950/80 border border-slate-800/80 px-3 py-1 rounded-full text-indigo-300 text-xs font-bold font-sans">
          <Award className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Status Tier: {user?.rank} Member</span>
        </div>

        {/* Dynamic EXP indicator */}
        <div className="mt-5 max-w-xs mx-auto">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
            <span>Level {user?.level} EXP progress</span>
            <span>{user?.exp} / {(user?.level || 1) * 1000}</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#2481cc] to-indigo-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, ((user?.exp || 0) % 1000) / 10))}%` }}
            ></div>
          </div>
        </div>

      </div>


      {/* 2. PROMO CODE CLAIMS REDEEMER */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center">
          <Gift className="w-4 h-4 mr-1.5 text-pink-500" />
          Redeem Gift Codes & Promos
        </h3>

        <form onSubmit={handleClaimCode} className="flex space-x-2">
          <input 
            id="promo-code-input"
            type="text"
            required
            placeholder="e.g. WELCOME, FREEBDT, SUPERSPIN"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
            className="flex-1 bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc] font-mono font-bold placeholder-slate-600"
          />
          <button 
            id="claim-code-submit"
            type="submit"
            disabled={isRedeeming}
            className="bg-[#2481cc] hover:bg-[#1a66a3] active:bg-[#134d7c] disabled:opacity-50 text-white px-4 rounded-lg text-xs font-black uppercase tracking-wider"
          >
            {isRedeeming ? 'CLAIMING...' : 'APPLY CODE'}
          </button>
        </form>

        <p className="text-[9px] text-slate-500 mt-2 text-left italic">
          *Codes give you free campaign credits, extra spins, or bonus coin packages instantly. Find them in our simulation logs.
        </p>

      </div>


      {/* 3. VIP MEMBERSHIP BANNER PANEL */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#2481cc]/5 border border-[#2481cc]/20 p-4 rounded-xl shadow-md relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#2481cc]/10 rounded-full blur-xl animate-pulse"></div>

        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest flex items-center font-mono">
              👑 Upgrade VIP Membership
            </span>
            <span className="text-lg font-black text-white mt-1">
              Unlock Elite Earnings 
            </span>
          </div>
          
          <span className="text-sm font-black font-mono text-green-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
            250 BDT
          </span>
        </div>

        {/* Benefits lists */}
        <div className="mt-4 space-y-2 text-[10.5px] text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Standard passive cloud mining boosted to <strong className="text-white">50 coins/hr</strong> (2.5x standard).</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span><strong className="text-white">0 BDT Platform Fees</strong> for launching customize Earn campaigns.</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Golden Crown profile badge visible across leaderboard.</span>
          </div>
        </div>

        <button 
          id="upgrade-vip-btn"
          onClick={handleBuyVip}
          disabled={user?.isVIP || isUpgradingVip}
          className={`mt-4.5 w-full font-black py-2 rounded-lg text-xs uppercase tracking-wider transition-all ${
            user?.isVIP 
              ? 'bg-slate-950/60 border border-slate-850 text-amber-500 text-center flex items-center justify-center cursor-default' 
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-md'
          }`}
        >
          {user?.isVIP ? '👑 You are a VIP Premium Member' : isUpgradingVip ? 'Upgrading account...' : 'Buy VIP using Main Balance'}
        </button>

      </div>


      {/* 4. SECURITY PROTECTION TELEMETRY */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center">
          <Shield className="w-4 h-4 mr-1.5 text-emerald-400 shrink-0" />
          Shield Device Telemetry Protection
        </h3>

        <div className="space-y-2.5">
          
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-850">
            <div className="flex flex-col text-left">
              <span className="text-xs text-white font-bold">VPN/Proxy spoof protection</span>
              <span className="text-[9px] text-slate-500">Auto-scans proxies and blocks bot queries</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-850">
            <div className="flex flex-col text-left">
              <span className="text-xs text-white font-bold">Anti-Spam Shield System</span>
              <span className="text-[9px] text-slate-500">Cooldown throttle for tasks verifications</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              ENGAGED
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-850">
            <div className="flex flex-col text-left font-mono">
              <span className="text-xs text-slate-300 flex items-center">
                <Laptop className="w-3.5 h-3.5 text-[#2481cc] mr-1" />
                IP: 192.168.1.109 / Secure Node
              </span>
              <span className="text-[9px] text-slate-500">Device signature matched telegram applet</span>
            </div>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
              SAFE
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};
