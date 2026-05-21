import React, { useState, useEffect } from 'react';
import { useSim } from './SimContext';
import { Task } from '../types';
import { 
  Plus, 
  Coins, 
  UploadCloud, 
  Trash2, 
  Info, 
  CheckCircle, 
  Eye, 
  Sliders, 
  BarChart2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const TaskUploadTab: React.FC = () => {
  const { 
    currentUserId, 
    user, 
    refreshUserData, 
    triggerNotification, 
    setActiveTab 
  } = useSim();

  // Create task states
  const [taskType, setTaskType] = useState<string>('telegram_join');
  const [title, setTitle] = useState<string>('');
  const [channelLink, setChannelLink] = useState<string>('');
  const [rewardAmount, setRewardAmount] = useState<number>(100); // 100 coins default
  const [rewardType, setRewardType] = useState<'coins' | 'cash'>('coins');
  const [userLimit, setUserLimit] = useState<number>(50);
  const [customRequirements, setCustomRequirements] = useState<string>('');
  const [screenshotRequired, setScreenshotRequired] = useState<boolean>(true);

  // My created campaigns list
  const [myCampaigns, setMyCampaigns] = useState<Task[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Compute grand cost
  // If cash, standard is in BDT (min 0.5BDT), if coins (min 100coins)
  const totalCost = Number(rewardAmount) * Number(userLimit);
  const baseCoins = rewardType === 'coins' ? totalCost : 0;
  const baseCash = rewardType === 'cash' ? totalCost : 0;
  
  // Custom charges
  const platformCharge = user?.isVIP ? 0 : 5.00; // standard 5 BDT platform service fee, VIP is 0 BDT!

  const fetchMyCreatedTasks = async () => {
    setIsLoadingCampaigns(true);
    try {
      const res = await fetch('/api/tasks/my-created', {
        headers: { 'x-user-id': currentUserId }
      });
      if (res.ok) {
        const data = await res.json();
        setMyCampaigns(data.tasks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchMyCreatedTasks();
  }, [currentUserId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !channelLink.trim()) {
      triggerNotification('Missing Fields', 'Please fill up task title and channel links.', 'warning');
      return;
    }

    if (rewardType === 'cash' && rewardAmount < 0.1) {
      triggerNotification('Validation Failed', 'Minimum reward for cash is 0.1 BDT per user.', 'warning');
      return;
    }
    if (rewardType === 'coins' && rewardAmount < 50) {
      triggerNotification('Validation Failed', 'Minimum reward for coins is 50 Coins per user.', 'warning');
      return;
    }
    if (userLimit < 5) {
      triggerNotification('User Limit Low', 'Minimum limit is 5 users to launch campaign.', 'warning');
      return;
    }

    // Since users spend BDT (Main/Deposit balance block) to create tasks,
    // if they offer COINS, we convert it: 1000 coins = 1 BDT cost on deposit balance standard
    const costInBDT = rewardType === 'cash' ? totalCost : (totalCost / 200.0); // 200 coins = 1 BDT cost index
    const grandCost = costInBDT + platformCharge;

    if (user && user.depositBalance < grandCost) {
      triggerNotification(
        'Insufficient Deposit Funds', 
        `Need ${grandCost.toFixed(2)} BDT on Deposit Balance (You have ${user.depositBalance.toFixed(2)} BDT). Please load cash.`,
        'error'
      );
      // Optional: switch to wallet
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({
          type: taskType,
          title: title.trim(),
          rewardAmount: Number(rewardAmount),
          rewardType,
          channelLink: channelLink.trim(),
          userLimit: Number(userLimit),
          customRequirements: customRequirements.trim() || undefined,
          screenshotRequired
        })
      });

      if (res.ok) {
        triggerNotification('Campaign Online! 🚀', `Your campaign "${title}" with limit of ${userLimit} is active in public wall!`, 'success');
        // Reset state
        setTitle('');
        setChannelLink('');
        setCustomRequirements('');
        
        refreshUserData();
        fetchMyCreatedTasks();
      } else {
        const err = await res.json();
        triggerNotification('Campaign Error', err.error || 'Failed to create task.', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto animate-in fade-in duration-200">
      
      {/* HEADER EXPLAINER */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md text-center">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-1 flex items-center justify-center">
          <Sliders className="w-4 h-4 mr-1.5 text-[#2481cc]" />
          Launch Customized Campaigns
        </h2>
        <p className="text-[11px] text-slate-400">
          Load your local billing Deposit balance, customize social view filters, and gather verified subscribers inside Telegram immediately.
        </p>
      </div>


      {/* CREATION FORM CARD */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        
        <form onSubmit={handleCreateTask} className="space-y-3">
          
          <div className="grid grid-cols-2 gap-3">
            {/* Task category type select */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Task Type</label>
              <select 
                id="task-platform-type"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-2.5 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc]"
              >
                <option value="telegram_join">Telegram Join Channel</option>
                <option value="telegram_view">Telegram Post View</option>
                <option value="youtube_sub">YouTube Subscribe</option>
                <option value="twitter_follow">X / Twitter Follow</option>
                <option value="website_visit">Website Visit Link</option>
                <option value="app_download">App Download link</option>
                <option value="custom">Custom verification text</option>
              </select>
            </div>

            {/* Reward Type split */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Reward Class</label>
              <select 
                id="task-reward-class"
                value={rewardType}
                onChange={(e) => {
                  setRewardType(e.target.value as any);
                  setRewardAmount(e.target.value === 'coins' ? 100 : 0.50);
                }}
                className="w-full bg-slate-950 text-white text-xs px-2.5 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc]"
              >
                <option value="coins">Simulation Coins 🪙</option>
                <option value="cash">BDT Cash Balance ৳</option>
              </select>
            </div>
          </div>


          {/* Campaign target Link details */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Launch Title</label>
            <input 
              id="task-title-input"
              type="text"
              required
              placeholder="e.g. Subscribe my official Crypto news feed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc]"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Target Channel / Landing Link</label>
            <input 
              id="task-target-url"
              type="url"
              required
              placeholder="e.g. https://t.me/yourchannel"
              value={channelLink}
              onChange={(e) => setChannelLink(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc] font-mono text-[11px]"
            />
          </div>


          {/* Reward Amount vs User Limits scale Sliders */}
          <div className="grid grid-cols-2 gap-3">
            
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Reward {rewardType === 'coins' ? '(Min 50)' : '(Min 0.1 BDT)'}
              </label>
              <input 
                id="task-reward-unit"
                type="number"
                step="any"
                min={rewardType === 'coins' ? 50 : 0.1}
                required
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Number(e.target.value))}
                className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Target User Limit (Min 5)
              </label>
              <input 
                id="task-target-limit"
                type="number"
                min="5"
                required
                value={userLimit}
                onChange={(e) => setUserLimit(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc]"
              />
            </div>

          </div>


          {/* Step custom requirements instructions */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Specific Instructions Requirements</label>
            <textarea 
              id="task-custom-desc"
              rows={2}
              placeholder="e.g. Join the telegram list. Do not leave the group for 3 weeks otherwise penalty will be applied."
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc]"
            />
          </div>

          {/* Screenshot toggle */}
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              Require Image proof verification
            </span>
            <input 
              id="require-screenshot-toggle"
              type="checkbox"
              checked={screenshotRequired}
              onChange={(e) => setScreenshotRequired(e.target.checked)}
              className="w-4 h-4 text-[#2481cc] bg-slate-950 border-slate-800 rounded focus:ring-0"
            />
          </div>


          {/* GRAND COST INDEX EXPLAINER BOX */}
          <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-lg flex flex-col space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Core Rewards Cost:</span>
              <span className="font-mono text-white font-bold">
                {totalCost} {rewardType === 'coins' ? 'Coins' : 'BDT'}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Platform Service Surcharge:</span>
              <span className="font-mono text-amber-400 font-bold">
                {platformCharge === 0 ? "FREE (VIP)" : `${platformCharge.toFixed(2)} BDT`}
              </span>
            </div>

            <div className="border-t border-slate-800 mt-1 pt-1.5 flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold uppercase">Estimated Creator Bill:</span>
              <span className="font-mono text-green-400 font-black">
                {rewardType === 'cash' 
                  ? `${(totalCost + platformCharge).toFixed(2)} BDT` 
                  : `${((totalCost / 200.0) + platformCharge).toFixed(2)} BDT`
                }
              </span>
            </div>
            <p className="text-[8px] text-slate-500 mt-1 italic tracking-normal text-left">
              *If creating index using coins, 200 Coins is converted into 1 BDT cost standard. Charges are debited from the Deposit Wallet.
            </p>
          </div>


          {/* SUBMIT BUTTON */}
          <button 
            id="launch-campaign-btn"
            type="submit"
            disabled={isCreating}
            className="w-full bg-[#2481cc] hover:bg-[#1a66a3] active:bg-[#134d7c] disabled:opacity-50 text-white font-black py-2.5 rounded-lg text-xs flex items-center justify-center tracking-wider uppercase shadow"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            {isCreating ? "Initializing Deployment..." : "Deploy Public Campaign"}
          </button>

        </form>

      </div>


      {/* CAMPAIGNS ANALYTICS DETAILED VIEW */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2.5 flex items-center">
          <BarChart2 className="w-4 h-4 mr-1.5 text-slate-400" />
          Active Creator Campaigns Analytics
        </h3>

        {isLoadingCampaigns ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Refreshing creator stats...
          </div>
        ) : myCampaigns.length === 0 ? (
          <div className="bg-slate-950 p-6 rounded text-center text-[10px] text-slate-500 border border-slate-850">
            You haven't launched any custom tasks yet. Complete details above to deploy campaign.
          </div>
        ) : (
          <div className="space-y-3">
            {myCampaigns.map((t) => {
              const perc = Math.min(100, Math.round((t.completedCount / t.userLimit) * 100));
              
              return (
                <div key={t.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex flex-col">
                  
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">
                      {t.title}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 rounded ${
                      t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono mb-2 truncate">
                    Url: {t.channelLink}
                  </span>

                  {/* Progress ratio */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Campaign Target: {perc}% Completed</span>
                    <span>{t.completedCount} / {t.userLimit} Users</span>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${perc}%` }}
                    ></div>
                  </div>

                  {/* Manual proof approvals alert note */}
                  <div className="mt-2 text-[9px] text-[#2481cc] flex items-center bg-[#2481cc]/5 p-1 px-2 rounded">
                    <Info className="w-3.5 h-3.5 mr-1" />
                    Pending work verifications can be approved instantly in the Admin tab.
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
