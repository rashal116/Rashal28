import React, { useState, useEffect } from 'react';
import { useSim } from './SimContext';
import { 
  Users, 
  Gift, 
  Copy, 
  CheckCircle, 
  Trophy, 
  Award, 
  Zap, 
  TrendingUp, 
  Flame,
  HelpCircle
} from 'lucide-react';
import { LeaderboardUser } from '../types';

export const ReferTab: React.FC = () => {
  const { 
    user, 
    triggerNotification 
  } = useSim();

  const [copied, setCopied] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingLdb, setLoadingLdb] = useState<boolean>(false);

  // Simulated link compile
  const referralLink = user 
    ? `${window.location.origin}/?ref=${user.referralCode}` 
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    triggerNotification('Link Copied! 👥', 'Referral link saved to clipboard! Share with friends.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const fetchLeaderboardData = async () => {
    setLoadingLdb(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLdb(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [user]);

  return (
    <div className="space-y-4 max-w-md mx-auto animate-in fade-in duration-200">
      
      {/* EXPLAINER HEADER */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md text-center">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-1 flex items-center justify-center">
          <Users className="w-4 h-4 mr-1.5 text-indigo-400" />
          Referral Network Commission
        </h2>
        <p className="text-[11px] text-slate-400">
          Enrich your social hierarchy. Receive bonus multipliers and immediate coins on every friend's registration.
        </p>
      </div>


      {/* REFERRAL LINK BOX CARD */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 p-4 rounded-xl shadow-md">
        
        <div className="flex items-center space-x-3 mb-4 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
          <div className="text-3xl bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/20">
            🎁
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-relaxed">
              Friend Invitation Bonus
            </span>
            <span className="text-[10px] text-indigo-400 font-medium font-mono leading-relaxed">
              +200 Coins & 10% Lifetime Earning Shares
            </span>
          </div>
        </div>

        {/* Action shareable inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Your Referral Code</label>
            <div className="flex bg-slate-950 p-2.5 rounded-lg border border-slate-850 items-center justify-between font-mono text-xs select-all text-indigo-300 font-black">
              <span>{user?.referralCode || "LOADING..."}</span>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase">Code</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Invite URL Link</label>
            <div className="flex space-x-2">
              <input 
                id="referral-link-input"
                type="text"
                readOnly
                value={referralLink || "generating..."}
                className="flex-1 bg-slate-950 text-slate-400 text-[10px] font-mono px-3 py-2 rounded-lg border border-slate-850 focus:outline-none"
              />
              <button 
                id="copy-referral-btn"
                onClick={handleCopyLink}
                className="bg-[#2481cc] hover:bg-[#1a66a3] active:bg-[#134d7c] text-white px-3 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                title="Copy Referral link"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800/80 pt-3 flex justify-between items-center text-[10px] text-slate-500">
          <span>Registered Referrals:</span>
          <span className="font-mono text-white font-black bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {user?.referralCount || 0} Members
          </span>
        </div>

      </div>


      {/* GLOBAL earners LEADERBOARD */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center">
          <Trophy className="w-4 h-4 mr-1.5 text-amber-500" />
          Global Coin Hall of Fame
        </h3>

        {loadingLdb ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Refreshing standings...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No rankings found.
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((u, idx) => {
              // Custom colors for top 3
              const placementColor = 
                idx === 0 ? 'bg-amber-500/20 border-amber-500 text-amber-400' :
                idx === 1 ? 'bg-slate-300/10 border-slate-400 text-slate-300' :
                idx === 2 ? 'bg-amber-700/10 border-amber-700 text-amber-600' :
                'bg-slate-950/40 border-slate-800 text-slate-400';

              const rankBadge = 
                idx === 0 ? '🥇' :
                idx === 1 ? '🥈' :
                idx === 2 ? '🥉' :
                `#${idx + 1}`;

              return (
                <div 
                  key={idx}
                  className={`border p-2.5 rounded-lg flex items-center justify-between transition-all ${placementColor}`}
                >
                  
                  {/* Left rank label */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-xs font-bold font-mono tracking-wider w-6 text-center">
                      {rankBadge}
                    </span>
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">
                        {u.firstName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        @{u.username}
                      </span>
                    </div>
                  </div>

                  {/* Right scores details */}
                  <div className="flex items-center space-x-3 font-mono text-right">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-amber-400">
                        {u.coins.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500">Coins</span>
                    </div>

                    <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-bold border border-slate-800 whitespace-nowrap">
                      Lvl {u.level}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
