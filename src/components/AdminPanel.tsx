import React, { useState, useEffect } from 'react';
import { useSim } from './SimContext';
import { Task, User, UserTaskSubmission, WithdrawRequest, TaskType } from '../types';
import { 
  ShieldCheck, 
  Users, 
  CheckSquare, 
  CreditCard, 
  Radio, 
  BarChart, 
  Plus, 
  X, 
  Check, 
  ArrowUpRight, 
  AlertTriangle, 
  Eye, 
  UserMinus, 
  UserPlus,
  Send,
  Sliders,
  DollarSign,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { 
    currentUserId, 
    user, 
    triggerNotification, 
    refreshUserData 
  } = useSim();

  // Active admin section tab
  const [adminSection, setAdminSection] = useState<'stats' | 'proofs' | 'withdraws' | 'users' | 'tasks' | 'broadcast'>('stats');

  // Staging metrics
  const [stats, setStats] = useState<any>(null);
  const [pendingSubs, setPendingSubs] = useState<UserTaskSubmission[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<WithdrawRequest[]>([]);
  const [usersDb, setUsersDb] = useState<User[]>([]);
  
  // Custom Task additions parameters
  const [newTaskCategory, setNewTaskCategory] = useState<TaskType>('telegram_join');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newChannelLink, setNewChannelLink] = useState<string>('');
  const [newRewardAmount, setNewRewardAmount] = useState<string>('200');
  const [newRewardType, setNewRewardType] = useState<'coins' | 'cash'>('coins');
  const [newUserLimit, setNewUserLimit] = useState<string>('100');
  const [newStaySeconds, setNewStaySeconds] = useState<string>('15');
  const [newFeatured, setNewFeatured] = useState<boolean>(true);

  // Broadcast settings
  const [alertTitle, setAlertTitle] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [broadcasting, setBroadcasting] = useState<boolean>(false);

  // Rejection parameters map
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  // Verify identity is admin
  const isSuperAdmin = user?.id === 'user_admin';

  const fetchAdminData = async () => {
    try {
      // stats
      const rStats = await fetch('/api/admin/stats');
      if (rStats.ok) {
        const d = await rStats.json();
        setStats(d.statistics);
      }

      // submissions block
      const rSubs = await fetch('/api/admin/submissions');
      if (rSubs.ok) {
        const d = await rSubs.json();
        setPendingSubs(d.submissions);
      }

      // withdrawals block
      const rWiths = await fetch('/api/admin/withdraws');
      if (rWiths.ok) {
        const d = await rWiths.json();
        setPendingPayouts(d.withdrawals);
      }

      // users lists
      const rUsr = await fetch('/api/admin/users');
      if (rUsr.ok) {
        const d = await rUsr.json();
        setUsersDb(d.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUserId, adminSection]);

  // PROOF VERIFICATION RESOLVERS
  const handleApproveSubmission = async (subId: string) => {
    try {
      const res = await fetch('/api/admin/submission/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: subId })
      });
      if (res.ok) {
        triggerNotification('Submission Approved ✔️', 'User credited successfully. Task completed counts increased.', 'success');
        fetchAdminData();
        refreshUserData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectSubmission = async (subId: string) => {
    const reason = rejectionReasons[subId] || "Failed verification specifications. Empty text handle.";
    try {
      const res = await fetch('/api/admin/submission/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: subId, reason })
      });
      if (res.ok) {
        triggerNotification('Submission Rejected ❌', 'User was alerted with the specific review reason.', 'warning');
        fetchAdminData();
        // remove custom mapped reason
        setRejectionReasons(prev => {
          const c = { ...prev };
          delete c[subId];
          return c;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // WITHDRAW ORDER RESOLVER
  const handleApproveWithDraw = async (wid: string, amt: number, method: string) => {
    try {
      const res = await fetch('/api/admin/withdraw/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawId: wid })
      });
      if (res.ok) {
        triggerNotification('Payout Disbursed 💰', `Approved ${amt} BDT via ${method} successfully.`, 'success');
        fetchAdminData();
        refreshUserData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ADMIN BAN CONTROLS
  const handleBanUserToggle = async (targetId: string, currentBanState: boolean) => {
    try {
      const res = await fetch('/api/admin/user/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetId, banState: !currentBanState })
      });
      if (res.ok) {
        triggerNotification(
          currentBanState ? 'Account Unbanned 🛡️' : 'Account Suspended 🚫', 
          currentBanState ? 'User can log in again.' : 'All bot services suspended for target user ID.',
          currentBanState ? 'success' : 'warning'
        );
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // BROADCAST NOTICES
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    setBroadcasting(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: alertTitle.trim(), message: alertMessage.trim() })
      });
      if (res.ok) {
        const d = await res.json();
        triggerNotification('Broadcast Sent! 📻', `Notified all ${d.recipientsCount} active network channels.`, 'success');
        setAlertTitle('');
        setAlertMessage('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBroadcasting(false);
    }
  };

  // CONFIGURE NEW OFFICIAL TASK
  const handleAddOfficialTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newChannelLink.trim() || !newRewardAmount || !newUserLimit) {
      triggerNotification('Setup Failed', 'Complete fields before compiling.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/admin/config/add-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newTaskCategory,
          title: newTaskTitle.trim(),
          channelLink: newChannelLink.trim(),
          rewardAmount: Number(newRewardAmount),
          rewardType: newRewardType,
          userLimit: Number(newUserLimit),
          isFeatured: newFeatured,
          viewRequirementSeconds: newTaskCategory === 'telegram_view' || newTaskCategory === 'website_visit' ? Number(newStaySeconds) : undefined
        })
      });

      if (res.ok) {
        triggerNotification('Official Task Online! ✔️', 'Created task. Triggered social updates to all users.', 'success');
        setNewTaskTitle('');
        setNewChannelLink('');
        setAdminSection('stats');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto bg-slate-900 border border-red-500/20 p-5 rounded-xl shadow text-center py-10 animate-in fade-in duration-200">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Access Restricted</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          The Admin Portal is locked to administrative credentials. Tap the <strong className="text-[#2481cc]">Simulation Settings (Gear icon)</strong> in the header bar and switch to <strong>Super Administrator</strong> to enable access instantly!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto animate-in fade-in duration-200 text-white">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-white uppercase tracking-wider">Admin Core Console</span>
            <span className="text-[10px] text-amber-500 font-semibold font-mono">Sim: ROOT_ACCESS_PRIVILEGED</span>
          </div>
        </div>
        <span className="text-[10px] bg-amber-500/15 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
          ONLINE
        </span>
      </div>


      {/* HORIZONTAL CONTROLLERS WRAPPER */}
      <div className="flex bg-slate-950 p-1.5 rounded-lg border border-slate-800 overflow-x-auto gap-1 text-slate-300">
        <button 
          onClick={() => setAdminSection('stats')} 
          className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded whitespace-nowrap ${adminSection === 'stats' ? 'bg-[#2481cc] text-white shadow' : 'hover:bg-slate-900'}`}
        >
          Stats
        </button>
        <button 
          onClick={() => setAdminSection('proofs')} 
          className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded whitespace-nowrap flex items-center ${adminSection === 'proofs' ? 'bg-[#2481cc] text-white' : 'hover:bg-slate-900'}`}
        >
          Proofs {pendingSubs.length > 0 && <span className="ml-1 bg-rose-500 text-white text-[9px] px-1 rounded-full animate-bounce">{pendingSubs.length}</span>}
        </button>
        <button 
          onClick={() => setAdminSection('withdraws')} 
          className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded whitespace-nowrap flex items-center ${adminSection === 'withdraws' ? 'bg-[#2481cc] text-white' : 'hover:bg-slate-900'}`}
        >
          Payouts {pendingPayouts.length > 0 && <span className="ml-1 bg-rose-500 text-white text-[9px] px-1 rounded-full">{pendingPayouts.length}</span>}
        </button>
        <button 
          onClick={() => setAdminSection('users')} 
          className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded whitespace-nowrap ${adminSection === 'users' ? 'bg-[#2481cc] text-white' : 'hover:bg-slate-900'}`}
        >
          Users
        </button>
        <button 
          onClick={() => setAdminSection('tasks')} 
          className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded whitespace-nowrap ${adminSection === 'tasks' ? 'bg-[#2481cc] text-white' : 'hover:bg-slate-900'}`}
        >
          + Task
        </button>
        <button 
          onClick={() => setAdminSection('broadcast')} 
          className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded whitespace-nowrap ${adminSection === 'broadcast' ? 'bg-[#2481cc] text-white' : 'hover:bg-slate-900'}`}
        >
          Broadcast
        </button>
      </div>


      {/* 1. STATE STATISTICS TAB */}
      {adminSection === 'stats' && (
        <div className="space-y-3">
          
          <div className="grid grid-cols-2 gap-3">
            
            {/* Total registers */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
              <Users className="w-5 h-5 text-[#2481cc] mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 uppercase block font-semibold leading-relaxed">Total Registers</span>
              <span className="text-base font-black font-mono text-white mt-0.5 block">{stats?.totalUsers || 0} Users</span>
            </div>

            {/* Active socials */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
              <Sliders className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 uppercase block font-semibold leading-relaxed">Active Tasks</span>
              <span className="text-base font-black font-mono text-white mt-0.5 block">{stats?.activeTasks || 0} Live</span>
            </div>

            {/* Cash deposit loads cumulative */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
              <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 uppercase block font-semibold leading-relaxed">Deposits Loaded</span>
              <span className="text-base font-black font-mono text-emerald-300 mt-0.5 block">{stats?.totalDeposited || 0} BDT</span>
            </div>

            {/* Cum payout cleared */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
              <DollarSign className="w-5 h-5 text-pink-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 uppercase block font-semibold leading-relaxed">Payouts Cleared</span>
              <span className="text-base font-black font-mono text-pink-300 mt-0.5 block">{stats?.totalWithdrawn || 0} BDT</span>
            </div>

          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-xs font-bold text-white uppercase block mb-1">Queue Health Logs</span>
            <div className="bg-slate-950 p-2 rounded text-[11px] text-slate-400 font-mono text-left space-y-1">
              <div className="flex justify-between">
                <span>Task Submissions Pending:</span>
                <span className="text-amber-400 font-bold">{pendingSubs.length} queued</span>
              </div>
              <div className="flex justify-between">
                <span>Payout Requests Pending:</span>
                <span className="text-amber-400 font-bold">{pendingPayouts.length} queued</span>
              </div>
            </div>
          </div>

        </div>
      )}


      {/* 2. TASK PROOFS APPROVALS WALL */}
      {adminSection === 'proofs' && (
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
            Review Claims Verification Queue ({pendingSubs.length})
          </h3>

          {pendingSubs.length === 0 ? (
            <div className="bg-slate-900 p-8 rounded-xl text-center text-slate-500 text-xs">
              <ShieldCheck className="w-8 h-8 text-slate-650 mx-auto mb-2" />
              Proofs queue is entirely verified. No submissions pending!
            </div>
          ) : (
            pendingSubs.map((sub) => (
              <div key={sub.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-2 flex flex-col text-left">
                
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{sub.taskTitle}</span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      Claimant: <strong className="text-slate-350">@{sub.username}</strong> ({sub.userId})
                    </span>
                  </div>
                  <span className="text-[9px] bg-slate-950 text-indigo-400 border border-slate-800 px-1.5 py-0.2 rounded font-sans uppercase">
                    {sub.rewardAmount} {sub.rewardType === 'coins' ? 'Coins' : 'BDT'}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-xs font-mono text-slate-300">
                  <span className="text-[9px] text-slate-500 font-sans block uppercase mb-0.5">Evidence Handler text:</span>
                  {sub.proofText}
                </div>

                {sub.proofUrl && (
                  <div className="relative border border-slate-850 rounded overflow-hidden">
                    <span className="absolute top-1 left-1 bg-slate-950/80 text-[8px] font-bold text-white px-1.5 rounded">Mock Proof Screenshot:</span>
                    <img 
                      referrerPolicy="no-referrer"
                      src={sub.proofUrl} 
                      alt="Work Proof" 
                      className="w-full h-24 object-cover hover:opacity-95 transition-opacity"
                    />
                  </div>
                )}

                {/* Approve/Reject interaction controls */}
                <div className="flex flex-col space-y-1.5 pt-1.5 border-t border-slate-800/60">
                  <div className="flex space-x-2">
                    <input 
                      id={`rec-reason-${sub.id}`}
                      type="text"
                      placeholder="Comment reason prefix if rejecting..."
                      value={rejectionReasons[sub.id] || ''}
                      onChange={(e) => setRejectionReasons({ ...rejectionReasons, [sub.id]: e.target.value })}
                      className="flex-1 bg-slate-950 text-[11px] px-2.5 py-1 rounded border border-slate-850 focus:outline-none focus:border-[#2481cc]"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      id={`reject-proof-${sub.id}`}
                      onClick={() => handleRejectSubmission(sub.id)}
                      className="w-1/2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 text-rose-400 py-1 rounded text-xs font-semibold uppercase"
                    >
                      Reject Proof
                    </button>
                    <button 
                      id={`approve-proof-${sub.id}`}
                      onClick={() => handleApproveSubmission(sub.id)}
                      className="w-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1 rounded text-xs font-black uppercase"
                    >
                      Approve & Credit
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}


      {/* 3. WITHDRAW CLEARANCE WALL */}
      {adminSection === 'withdraws' && (
        <div className="space-y-2.5 font-sans">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
            Review Withdrawal Clearance orders ({pendingPayouts.length})
          </h3>

          {pendingPayouts.length === 0 ? (
            <div className="bg-slate-900 p-8 rounded-xl text-center text-slate-500 text-xs">
              <ShieldCheck className="w-8 h-8 text-slate-650 mx-auto mb-2" />
              Clearance completely empty. All payouts cleared!
            </div>
          ) : (
            pendingPayouts.map((w) => (
              <div key={w.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col text-left text-xs">
                
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white flex items-center">
                    💰 Payout request: {w.amount} BDT
                  </span>
                  <span className="text-[10px] text-indigo-400 bg-slate-950 rounded px-1.5 py-0.1 border border-slate-850 uppercase font-mono">
                    {w.method}
                  </span>
                </div>

                <div className="bg-slate-950 p-2 rounded border border-slate-850 text-[10px] font-mono text-slate-400 mt-1">
                  <p>Receiver Handle: @{w.username} ({w.userId})</p>
                  <p className="mt-0.5">Wallet target: <strong className="text-white select-all">{w.info}</strong></p>
                </div>

                <button 
                  id={`payout-approve-${w.id}`}
                  onClick={() => handleApproveWithDraw(w.id, w.amount, w.method)}
                  className="mt-3 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Clear billing payload & approve
                </button>

              </div>
            ))
          )}
        </div>
      )}


      {/* 4. USERS MANAGEMENT DATA BASE */}
      {adminSection === 'users' && (
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
            Registered Simulation Accounts ({usersDb.length})
          </h3>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {usersDb.map((u) => (
              <div key={u.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs">
                
                <div className="flex items-center space-x-2.5 min-w-0">
                  <img 
                    referrerPolicy="no-referrer"
                    src={u.avatarUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&h=150&q=80"} 
                    alt="user" 
                    className="w-8 h-8 rounded-full border border-slate-850 object-cover"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-slate-100 font-bold truncate leading-relaxed">
                      {u.firstName || 'Telegram'} {u.lastName || 'User'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate leading-normal">
                      @{u.username} • Lvl {u.level}
                    </span>
                  </div>
                </div>

                {/* Ban toggler */}
                <div className="flex items-center space-x-2 shrink-0 font-mono">
                  <div className="text-right text-[10px] text-slate-400 pr-1 leading-normal">
                    <p>M: {u.mainBalance.toFixed(1)}৳</p>
                    <p>C: {u.coinBalance}c</p>
                  </div>

                  {u.id !== 'user_admin' && (
                    <button 
                      id={`ban-usr-toggle-${u.id}`}
                      onClick={() => handleBanUserToggle(u.id, u.banned)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.banned 
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' 
                          : 'bg-rose-950/40 text-rose-400 hover:bg-[#ffe4e6]/5 border border-rose-500/20'
                      }`}
                    >
                      {u.banned ? 'UNBAN' : 'BAN'}
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}


      {/* 5. ADD OFFICIAL SYSTEM TASK FORMS */}
      {adminSection === 'tasks' && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <span className="text-xs font-black text-white uppercase tracking-wider block mb-3">Configure official tasks platform</span>
          
          <form onSubmit={handleAddOfficialTask} className="space-y-3 text-left">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Type</label>
                <select 
                  id="admin-new-task-type"
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded border border-slate-850"
                >
                  <option value="telegram_join">Telegram Join</option>
                  <option value="telegram_view">Telegram Viewstay</option>
                  <option value="youtube_sub">YouTube sub</option>
                  <option value="twitter_follow">X Twitter follow</option>
                  <option value="website_visit">Website stay visit</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Reward Type</label>
                <select 
                  id="admin-new-reward-type"
                  value={newRewardType}
                  onChange={(e) => {
                    setNewRewardType(e.target.value as any);
                    setNewRewardAmount(e.target.value === 'coins' ? '250' : '2.00');
                  }}
                  className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded border border-slate-850"
                >
                  <option value="coins">Coins 🪙</option>
                  <option value="cash">BDT Cash ৳</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Title</label>
              <input 
                id="admin-new-task-title"
                type="text" 
                required
                placeholder="e.g. Subscribe DeepMind official feed"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded border border-slate-850"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Target URL link</label>
              <input 
                id="admin-new-task-link"
                type="url" 
                required
                placeholder="https://t.me/example"
                value={newChannelLink}
                onChange={(e) => setNewChannelLink(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded border border-slate-850 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Reward</label>
                <input 
                  id="admin-new-reward-amt"
                  type="number" 
                  step="any"
                  required
                  value={newRewardAmount}
                  onChange={(e) => setNewRewardAmount(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-1.5 rounded border border-slate-850"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Limits Slot</label>
                <input 
                  id="admin-new-user-limit"
                  type="number" 
                  required
                  value={newUserLimit}
                  onChange={(e) => setNewUserLimit(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-1.5 rounded border border-slate-850"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Stay View (s)</label>
                <input 
                  id="admin-new-stay-seconds"
                  type="number" 
                  required
                  value={newStaySeconds}
                  onChange={(e) => setNewStaySeconds(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-1.5 rounded border border-slate-850"
                  disabled={newTaskCategory !== 'telegram_view' && newTaskCategory !== 'website_visit'}
                />
              </div>
            </div>

            <button 
              id="admin-add-task-submit"
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded text-xs uppercase shadow tracking-wider"
            >
              Compile & Inject System Task
            </button>

          </form>

        </div>
      )}


      {/* 6. SYSTEM NOTICE BROADCAST TAB */}
      {adminSection === 'broadcast' && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <span className="text-xs font-black text-white uppercase block mb-3">Global Broadcast Transmitter</span>
          
          <form onSubmit={handleSendBroadcast} className="space-y-3 text-left">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Alert Title banner</label>
              <input 
                id="broad-title-input"
                type="text" 
                required
                placeholder="e.g. Anti-Spam Maintenance alert 🛡️"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded focus:outline-none border border-slate-850"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Detailed Log message</label>
              <textarea 
                id="broad-msg-input"
                rows={3}
                required
                placeholder="Details of warning emitted for all registrants..."
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded focus:outline-none border border-slate-850"
              />
            </div>

            <button
              id="broad-submit-btn"
              type="submit"
              disabled={broadcasting}
              className="w-full bg-gradient-to-r from-[#2481cc] to-indigo-600 hover:opacity-95 text-white font-black py-2 rounded text-xs uppercase flex items-center justify-center tracking-wider"
            >
              <Send className="w-4 h-4 mr-1.5" />
              {broadcasting ? 'Transmitting payload...' : 'Emit System Wide Alert'}
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
