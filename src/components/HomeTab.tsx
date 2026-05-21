import React, { useState, useEffect, useRef } from 'react';
import { useSim } from './SimContext';
import { 
  Plus, 
  Coins, 
  Calendar, 
  Hammer, 
  Dices, 
  Play, 
  Check, 
  Flame, 
  TrendingUp, 
  HelpCircle,
  Gem,
  Award
} from 'lucide-react';

export const HomeTab: React.FC = () => {
  const { 
    user, 
    mining, 
    currentUserId, 
    refreshUserData, 
    triggerNotification, 
    setActiveTab 
  } = useSim();

  // Miner claims status
  const [mineTicker, setMineTicker] = useState<number>(0);
  const [isMinting, setIsMinting] = useState<boolean>(false);

  // Wheel state
  const [spinning, setSpinning] = useState<boolean>(false);
  const [prizeIndex, setPrizeIndex] = useState<number | null>(null);
  const [spinResultMsg, setSpinResultMsg] = useState<string>('');
  const [showSpinModal, setShowSpinModal] = useState<boolean>(false);

  // Scratch card state
  const [showScratchModal, setShowScratchModal] = useState<boolean>(false);
  const [scratchRevealed, setScratchRevealed] = useState<boolean>(false);
  const [isScratching, setIsScratching] = useState<boolean>(false);
  const [scratchReward, setScratchReward] = useState<{ type: string, amount: number, label: string } | null>(null);

  // Update cloud miner live count on frontend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mining?.miningActive) {
      timer = setInterval(() => {
        const last = new Date(mining.lastClaimTime).getTime();
        const now = Date.now();
        const hoursDiff = (now - last) / (3600 * 1000);
        // limit to 24h
        const finalHours = Math.min(24, hoursDiff);
        const earned = finalHours * mining.miningSpeedPerHour;
        setMineTicker(Number(earned.toFixed(4)));
      }, 1000);
    } else {
      setMineTicker(0);
    }
    return () => clearInterval(timer);
  }, [mining]);

  // DAILY CHECK-IN TRIGGER
  const handleDailyCheckIn = async () => {
    try {
      const res = await fetch('/api/user/daily-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        }
      });
      if (res.ok) {
        const data = await res.json();
        triggerNotification(
          'Daily Checkin Cleared! 📅', 
          `Congratulations! Enjoyed +${data.coinsEarned} Coins. Current streak is ${data.streak} day(s).`,
          'success'
        );
        refreshUserData();
      } else {
        const err = await res.json();
        triggerNotification('Limit Reached', err.error || 'Check-in failed.', 'warning');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // LUCKY WHEEL SPIN ACTION
  const handleSpinWheel = async () => {
    if (spinning) return;
    if (user && user.coinBalance < 100) {
      triggerNotification('Insufficient coins', 'Each spin costs 100 coins. Go complete tasks first!', 'warning');
      return;
    }

    setSpinning(true);
    setPrizeIndex(null);
    setSpinResultMsg('');

    try {
      const res = await fetch('/api/games/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPrizeIndex(data.rewardIndex);
        
        // Wait 3 seconds for rotation spin animation to play!
        setTimeout(() => {
          setSpinning(false);
          setSpinResultMsg(`🎉 You won: ${data.wonItem.label}!`);
          triggerNotification('Spin Win! 🎡', `You won ${data.wonItem.label}. Credited immediately!`, 'success');
          refreshUserData();
        }, 3000);

      } else {
        setSpinning(false);
        const err = await res.json();
        triggerNotification('Spin Error', err.error || 'Spin failed.', 'error');
      }
    } catch (e) {
      setSpinning(false);
      console.error(e);
    }
  };

  // START ACTIVE CLOUD MINING
  const handleStartMining = async () => {
    if (mining?.miningActive) return;
    setIsMinting(true);
    try {
      const res = await fetch('/api/mining/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        }
      });
      if (res.ok) {
        triggerNotification('Mining Started ⛏️', 'Cloud cores fired up successfully. Check back in a few hours to claim coins!', 'success');
        refreshUserData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMinting(false);
    }
  };

  // CLAIM MINING COINS
  const handleClaimMining = async () => {
    if (!mining?.miningActive) return;
    try {
      const res = await fetch('/api/mining/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        }
      });
      if (res.ok) {
        refreshUserData();
      } else {
        const err = await res.json();
        triggerNotification('Claim Failed', err.error || 'Failed to claim coins. Mine at least 1 coin first.', 'warning');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // SCRATCH CARDS REVENUE REVEAL
  const handleBuyScratchCard = async () => {
    if (user && user.coinBalance < 50) {
      triggerNotification('Coins Needed 🪙', 'Scratch card requires 50 simulation coins.', 'warning');
      return;
    }
    
    setScratchRevealed(false);
    setIsScratching(false);
    const canvas = document.getElementById('scratch-pad');
    if (canvas) {
      const ctx = (canvas as HTMLCanvasElement).getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, 0, 200, 100);
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px Courier';
        ctx.fillText('SCRATCH HERE ✍️', 50, 55);
      }
    }

    try {
      const res = await fetch('/api/games/scratch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        }
      });
      if (res.ok) {
        const data = await res.json();
        setScratchReward({
          type: data.wonItem.type,
          amount: data.wonItem.amount,
          label: data.wonItem.label
        });
        setShowScratchModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Render checkin boxes for visual aesthetic (7 days calendar)
  const renderCheckInDays = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkinDays = [
      { day: 1, c: 150 },
      { day: 2, c: 200 },
      { day: 3, c: 250 },
      { day: 4, c: 300 },
      { day: 5, c: 350 },
      { day: 6, c: 400 },
      { day: 7, c: 450 }
    ];

    const currentStreak = user?.dailyStreak || 0;
    const isTodayClaimed = user?.lastCheckIn === todayStr;

    return checkinDays.map(item => {
      // Completed, Active (Today), or Locked (Future)
      const isCompleted = item.day <= currentStreak && (item.day < currentStreak || isTodayClaimed);
      const isTodayActive = item.day === currentStreak + 1 && !isTodayClaimed;

      return (
        <div 
          key={item.day} 
          className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
            isCompleted 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : isTodayActive 
                ? 'bg-[#2481cc]/20 border-[#2481cc] ring-2 ring-[#2481cc]/40 animate-pulse' 
                : 'bg-slate-950/40 border-slate-800'
          }`}
        >
          <span className="text-[10px] text-slate-500 font-bold uppercase">Day {item.day}</span>
          <Coins className={`w-4 h-4 my-1.5 ${isCompleted ? 'text-emerald-400' : isTodayActive ? 'text-amber-400' : 'text-slate-600'}`} />
          <span className="text-[10px] font-mono font-bold text-white">+{item.c}</span>
          
          {isCompleted && (
            <span className="mt-1 text-[8px] bg-emerald-500 text-slate-950 font-bold px-1 rounded flex items-center">
              CLAIMED
            </span>
          )}
          {isTodayActive && (
            <button 
              id="claim-instant-btn"
              onClick={handleDailyCheckIn}
              className="mt-1 text-[8px] bg-[#2481cc] text-white font-extrabold px-1 rounded animate-bounce shadow"
            >
              TAP
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4 max-w-md mx-auto animate-in fade-in duration-200">
      
      {/* 1. PRIMARY MULTI-WALLETS STATS */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl relative overflow-hidden">
        
        {/* Background grid details */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#2481cc]/5 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase transition-all">
              👑 Rank {user?.rank}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center">
            EXP {user?.exp} / {(user?.level || 1)*1000}
          </span>
        </div>

        {/* Exp progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-5">
          <div 
            className="bg-gradient-to-r from-[#2481cc] to-indigo-500 h-full transition-all duration-300" 
            style={{ width: `${Math.min(100, Math.max(5, ((user?.exp || 0) % 1000) / 10))}%` }}
          ></div>
        </div>

        {/* Live balances split cards */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Main Money Balance */}
          <div 
            onClick={() => setActiveTab('wallet')} 
            className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg flex flex-col cursor-pointer hover:border-slate-700/80 transition-all group"
          >
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase font-semibold mb-1">
              <span>Main Wallet</span>
              <Gem className="w-3.5 h-3.5 text-[#2481cc] group-hover:scale-110 transition-transform" />
            </div>
            <span id="cash-balance-display" className="text-lg font-black text-white font-mono flex items-baseline">
              {user?.mainBalance?.toFixed(2)}
              <span className="text-[10px] font-bold text-slate-400 ml-1">BDT</span>
            </span>
            <span className="text-[9px] text-slate-500 mt-1">Real payout funds</span>
          </div>

          {/* Social Coins */}
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg flex flex-col">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase font-semibold mb-1">
              <span>My Coins</span>
              <Coins className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span id="coin-balance-display" className="text-lg font-black text-amber-400 font-mono flex items-baseline">
              {user?.coinBalance}
              <span className="text-[9px] text-slate-400 ml-1">Coins</span>
            </span>
            <span className="text-[9px] text-amber-500/80 mt-1 flex items-center">
              🔥 Streak: {user?.dailyStreak} day(s)
            </span>
          </div>

        </div>

        {/* Deposit balance bar */}
        {user && user.depositBalance > 0 && (
          <div className="mt-3 bg-indigo-950/30 border border-indigo-500/20 p-2.5 rounded-lg flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-indigo-400 font-semibold font-mono uppercase">Deposit Balance</span>
              <span className="text-xs font-black text-slate-200">{user.depositBalance.toFixed(2)} BDT</span>
            </div>
            <button 
              id="create-task-btn-home"
              onClick={() => setActiveTab('taskUpload')} 
              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded"
            >
              RUN TASK
            </button>
          </div>
        )}

      </div>


      {/* 2. DAILY CHECK-IN SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
            Daily Task Check-In Rewards
          </span>
          {user?.lastCheckIn === new Date().toISOString().split('T')[0] ? (
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              TODAY CLAIMED
            </span>
          ) : (
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-bounce">
              PENDING CLAIM
            </span>
          )}
        </h3>

        {/* 7 Days calendar splits */}
        <div className="grid grid-cols-7 gap-1.5">
          {renderCheckInDays()}
        </div>
      </div>


      {/* 3. CLOUD MINER SYSTEM */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md relative overflow-hidden">
        
        {/* Background animation for worker */}
        {mining?.miningActive && (
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl animate-pulse"></div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center">
              <Hammer className="w-4 h-4 mr-1.5 text-slate-400" />
              Simulated Telegram Cloud Miner
            </h3>
            <p className="text-[10px] text-slate-500">
              Generates passive coins safely in the background
            </p>
          </div>

          <span className="text-[10px] font-bold text-slate-300 font-mono bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full flex items-center">
            <TrendingUp className="w-3 h-3 text-emerald-400 mr-1 animate-pulse" />
            {mining?.miningSpeedPerHour || 20}Coins/Hr
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center relative flex flex-col justify-center items-center">
          
          {mining?.miningActive ? (
            <>
              {/* Spinning gear visual */}
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-full border-4 border-dashed border-emerald-500 flex items-center justify-center animate-spin duration-3000">
                  <Hammer className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-slate-950 flex items-center justify-center animate-ping"></span>
              </div>

              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight animate-pulse">
                {mineTicker.toFixed(4)}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">
                Passive Unclaimed Coins
              </span>
              <p className="text-[10px] text-slate-500 mt-2">
                Co-engines active since {new Date(mining.lastClaimTime).toLocaleTimeString()}
              </p>

              <button 
                id="claim-miner-btn"
                onClick={handleClaimMining}
                disabled={mineTicker < 1}
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-2 rounded-lg text-xs tracking-wider uppercase transition-colors"
              >
                Claim {mineTicker >= 1 ? `+${Math.floor(mineTicker)} Coins` : "Pending Min 1 Coin"}
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center text-slate-600 mb-2">
                <Hammer className="w-5 h-5" />
              </div>
              <span className="text-base text-slate-500 font-bold uppercase tracking-wider">Miner is Offline</span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                Re-ignite CPU cores manually to generate passive income. VIP accounts mine at 2.5x standard speed!
              </p>

              <button 
                id="start-miner-btn"
                onClick={handleStartMining}
                disabled={isMinting}
                className="mt-4 w-full bg-[#2481cc] hover:bg-[#1a66a3] text-white font-black py-2 rounded-lg text-xs uppercase tracking-wider transition-colors"
              >
                {isMinting ? "Firing cores..." : "Ignite Miner Cores"}
              </button>
            </>
          )}

        </div>
      </div>


      {/* 4. BONUS GAMES SELECTOR: SPIN & SCRATCH */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center">
          <Dices className="w-4 h-4 mr-1.5 text-slate-400" />
          Earn Mini-Games (100% Payouts)
        </h3>

        <div className="grid grid-cols-2 gap-3">
          
          {/* Wheel trigger */}
          <div 
            onClick={() => { setShowSpinModal(true); setSpinResultMsg(''); }} 
            className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg hover:border-[#2481cc]/80 transition-all duration-200 text-center cursor-pointer group"
          >
            <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              🎡
            </div>
            <span className="text-xs font-bold text-slate-200 block">Lucky Spin</span>
            <span className="text-[9px] text-slate-500 block mt-1">Cost: 100 Coins / Play</span>
          </div>

          {/* Scratch cards */}
          <div 
            onClick={handleBuyScratchCard} 
            className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg hover:border-amber-500/80 transition-all duration-200 text-center cursor-pointer group"
          >
            <div className="w-10 h-10 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              ✍️
            </div>
            <span className="text-xs font-bold text-slate-200 block">Scratch Card</span>
            <span className="text-[9px] text-slate-500 block mt-1">Cost: 50 Coins / Card</span>
          </div>

        </div>
      </div>


      {/* --- LUCKY WHEEL POPUP DIAL --- */}
      {showSpinModal && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-center">
            
            <button 
              id="close-spin-modal"
              onClick={() => setShowSpinModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-white uppercase tracking-wider mb-2">Lucky Spin Wheel</h3>
            <p className="text-[11px] text-slate-400 mb-6">Spend 100 coins. Land on cash, bonus multipliers or free coins!</p>
            
            <div className="relative w-48 h-48 mx-auto my-6 flex items-center justify-center border-4 border-slate-950 rounded-full bg-slate-950 shadow-inner overflow-hidden">
              
              {/* Simulated Rotating wedges visual */}
              <div 
                id="spinning-wheel-disc"
                className={`w-full h-full rounded-full border-2 border-slate-800 transition-transform ${
                  spinning ? 'duration-3000 ease-in-out' : ''
                }`}
                style={{
                  transform: spinning 
                    ? `rotate(${3600 + (prizeIndex !== null ? (prizeIndex * 45) : 180)}deg)` 
                    : `rotate(${prizeIndex !== null ? (prizeIndex * 45) : 0}deg)`,
                  transition: spinning ? 'transform 3s cubic-bezier(0.12, 0.8, 0.23, 0.99)' : 'none',
                  background: 'repeating-conic-gradient(from 0deg, #1e1b4b 0deg 45deg, #111827 45deg 90deg)'
                }}
              >
                {/* Labels relative inside the wedges */}
                <div className="absolute top-2 left-1/2 -ml-4 text-[10px] font-bold text-slate-400 transform -rotate-90 origin-bottom transform translate-y-12">50C</div>
                <div className="absolute top-2 left-1/2 -ml-4 text-[10px] font-bold text-[#2481cc] transform -rotate-45 origin-bottom transform translate-y-12">2 BDT</div>
                <div className="absolute top-2 left-1/2 -ml-4 text-[10px] font-bold text-slate-400 transform origin-bottom transform translate-y-12">500C</div>
                <div className="absolute top-2 left-1/2 -ml-4 text-[10px] font-bold text-amber-400 transform rotate-45 origin-bottom transform translate-y-12">5 BDT</div>
                <div className="absolute top-2 left-1/2 -ml-4 text-[10px] font-bold text-slate-400 transform rotate-90 origin-bottom transform translate-y-12">1KC</div>
                <div className="absolute top-2 left-1/2 -ml-4 text-[10px] font-bold text-pink-500 transform rotate-135 origin-bottom transform translate-y-12">20BDT</div>
                <div className="absolute top-2 left-1/2 -ml-4 text-[10px] font-bold text-rose-500 transform rotate-180 origin-bottom transform translate-y-12">TRY OUT</div>
                <div className="absolute top-2 left-1/2 -ml-4 text-[10px] font-bold text-slate-400 transform rotate-225 origin-bottom transform translate-y-12">200C</div>
              </div>

              {/* Central spinning needle / overlay */}
              <div className="absolute w-10 h-10 bg-[#2481cc] rounded-full border-4 border-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-lg">
                SPIN
              </div>
              <div className="absolute top-0 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-rose-500 z-10-index"></div>
            </div>

            {spinResultMsg && (
              <div className="mt-4 bg-[#2481cc]/15 border border-[#2481cc]/30 p-2.5 rounded-lg text-sm text-slate-200 font-bold animate-bounce">
                {spinResultMsg}
              </div>
            )}

            <div className="mt-6 flex space-x-3">
              <button 
                id="modal-dismiss-btn"
                onClick={() => setShowSpinModal(false)}
                className="w-1/2 bg-slate-800 text-slate-400 py-2 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button 
                id="spin-trigger-btn"
                onClick={handleSpinWheel}
                disabled={spinning}
                className="w-1/2 bg-[#2481cc] hover:bg-[#1a66a3] disabled:opacity-50 font-black py-2 rounded-lg text-xs"
              >
                {spinning ? 'SPINNING...' : 'SPIN (-100 Coins)'}
              </button>
            </div>

          </div>
        </div>
      )}


      {/* --- SCRATCH CARD REVEAL DIAL --- */}
      {showScratchModal && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-center">
            
            <button 
              id="close-scratch-modal"
              onClick={() => setShowScratchModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-white uppercase tracking-wider mb-1">Double SCRATCH Card</h3>
            <p className="text-[11px] text-slate-400 mb-5">Click and reveal your hidden balance rewards from the container scratch box below!</p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative select-none">
              
              {/* Revealed result under the pad */}
              <div className="flex flex-col items-center justify-center py-4">
                <span className="text-xs text-slate-500 font-mono uppercase">Revealed Prize:</span>
                <span className="text-2xl font-black text-amber-500 font-mono animate-pulse mt-0.5">
                  {scratchReward ? scratchReward.label : 'Loading...'}
                </span>
                <span className="text-[10px] text-slate-400 mt-2 font-mono">
                  State verified via Telegram API
                </span>
              </div>

              {/* Overlay scratch box simulating with simple mouse hover/click interaction */}
              {!scratchRevealed && (
                <div 
                  id="scratch-pad-block"
                  onClick={() => {
                    setIsScratching(true);
                    setTimeout(() => {
                      setScratchRevealed(true);
                      triggerNotification('Card Scratched! ✍️', `You received ${scratchReward?.label || "lucky prize"}!`, 'success');
                      refreshUserData();
                    }, 1200);
                  }}
                  className="absolute inset-0 bg-slate-700/80 hover:bg-slate-600/70 cursor-pointer flex items-center justify-center rounded-xl p-3 border-2 border-dashed border-slate-600 animate-pulse text-white font-bold font-mono text-xs"
                >
                  {isScratching ? (
                    <span className="text-indigo-300 font-bold uppercase animate-pulse">
                      SCRATCHING SURFACE...
                    </span>
                  ) : (
                    <span className="text-center px-4 leading-relaxed">
                      TAP SECURELY TO SCRATCH ✍️
                    </span>
                  )}
                </div>
              )}

            </div>

            {scratchRevealed && (
              <p className="text-xs text-green-400 font-semibold font-sans mt-3">
                Payout transferred to your active balances successfully!
              </p>
            )}

            <div className="mt-6 flex space-x-3">
              <button 
                id="scratch-card-close"
                onClick={() => setShowScratchModal(false)}
                className="w-1/2 bg-slate-800 text-slate-400 py-2 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button 
                id="buy-another-scratch"
                onClick={handleBuyScratchCard}
                className="w-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-lg text-xs"
              >
                Buy Another (-50 Coins)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
