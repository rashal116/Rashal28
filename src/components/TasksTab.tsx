import React, { useState, useEffect } from 'react';
import { useSim } from './SimContext';
import { 
  Task, 
  TaskType, 
  UserTaskSubmission 
} from '../types';
import { 
  ExternalLink,
  Timer,
  CheckCircle,
  FileText,
  UploadCloud,
  AlertTriangle,
  Flame,
  Award,
  BookOpen,
  Send,
  XCircle,
  Clock
} from 'lucide-react';

export const TasksTab: React.FC = () => {
  const { 
    currentUserId, 
    user, 
    refreshUserData, 
    triggerNotification 
  } = useSim();

  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<UserTaskSubmission[]>([]);
  const [filterCategory, setFilterCategory] = useState<'all' | 'featured' | 'social' | 'custom'>('all');
  
  // Active task click timer states
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerPassed, setTimerPassed] = useState<boolean>(false);

  // Submission popup state
  const [submitTask, setSubmitTask] = useState<Task | null>(null);
  const [proofText, setProofText] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [submittingPrf, setSubmittingPrf] = useState<boolean>(false);

  // Fetch lists
  const fetchTasksData = async () => {
    try {
      // tasks
      const resTasks = await fetch('/api/tasks', {
        headers: { 'x-user-id': currentUserId }
      });
      if (resTasks.ok) {
        const data = await resTasks.json();
        setActiveTasks(data.tasks);
      }

      // submissions
      const resSubs = await fetch('/api/user/submissions', {
        headers: { 'x-user-id': currentUserId }
      });
      if (resSubs.ok) {
        const data = await resSubs.json();
        setSubmissions(data.submissions.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, [currentUserId]);

  // TIMER HANDLER: Simulate staying on external page
  const handleStartTaskLink = (task: Task) => {
    // Open task channel link in new tab safely
    window.open(task.channelLink, '_blank', 'noopener,noreferrer');
    
    // Trigger stay countdown timer if exists
    if (task.viewRequirementSeconds && task.viewRequirementSeconds > 0) {
      setRunningTaskId(task.id);
      setTimerSecondsLeft(task.viewRequirementSeconds);
      setTimerPassed(false);
      triggerNotification(
        'Post Stay Countdown started! ⏱️', 
        `Stay on the post/website for at least ${task.viewRequirementSeconds} seconds to verify.`,
        'info'
      );
    } else {
      // Direct prompt proof dialog
      setSubmitTask(task);
      setProofText('');
      setProofUrl('');
    }
  };

  // Timer tick down
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (runningTaskId && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            setTimerPassed(true);
            setRunningTaskId(null);
            triggerNotification('Ad View Verified! ✔️', 'Stay limit finished. You can now submit proof or autocomplete.', 'success');
            
            // Auto trigger submission box for user once countdown ends
            const targetTask = activeTasks.find(t => t.id === runningTaskId);
            if (targetTask) {
              setSubmitTask(targetTask);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [runningTaskId, timerSecondsLeft, activeTasks]);

  // SUBMIT PROOF FORM WITH AUTO-VERIFY FOR NO SCREENSHOT OR MANUAL SUB
  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTask) return;

    if (submitTask.screenshotRequired && !proofUrl.trim() && !proofText.trim()) {
      triggerNotification('Proof Required', 'Please enter your handler username or upload screenshot image url proof.', 'warning');
      return;
    }

    setSubmittingPrf(true);
    try {
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({
          taskId: submitTask.id,
          proofText: proofText.trim() || `User verified task link: ${user?.username}`,
          proofUrl: proofUrl.trim() || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&h=250&q=80'
        })
      });

      if (res.ok) {
        triggerNotification('Submission Queued! ⌛', 'Submissions will be verified shortly by the creators.', 'success');
        setSubmitTask(null);
        setProofText('');
        setProofUrl('');
        refreshUserData();
        fetchTasksData();
      } else {
        const err = await res.json();
        triggerNotification('Submission Error', err.error || 'Failed to submit proof.', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingPrf(false);
    }
  };

  // Check if current user has already submitted proof for a specific task
  const getSubStatus = (taskId: string) => {
    const s = submissions.find(sub => sub.taskId === taskId);
    return s ? s.status : null;
  };

  // Helper labels for task categories
  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case 'telegram_join':
        return '📢';
      case 'telegram_view':
        return '👁️';
      case 'youtube_sub':
        return '🎥';
      case 'twitter_follow':
        return '🐦';
      case 'website_visit':
        return '🌐';
      case 'app_download':
        return '📱';
      default:
        return '📋';
    }
  };

  // Filtering list
  const filteredTasks = activeTasks.filter(t => {
    if (filterCategory === 'featured') return t.isFeatured;
    if (filterCategory === 'social') return ['telegram_join', 'telegram_view', 'youtube_sub', 'twitter_follow'].includes(t.type);
    if (filterCategory === 'custom') return t.type === 'custom' || t.creatorId !== 'admin';
    return true;
  });

  return (
    <div className="space-y-4 max-w-md mx-auto animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm text-center">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-1 flex items-center justify-center">
          <Award className="w-4 h-4 mr-1.5 text-amber-400" />
          Task Board Wall
        </h2>
        <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
          Complete official promotions or custom micro-campaigns to harvest coins and withdraw real BDT money credits.
        </p>

        {/* Categories toggles tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/80 mt-4 space-x-1">
          {['all', 'featured', 'social', 'custom'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as any)}
              className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition-all ${
                filterCategory === cat 
                  ? 'bg-[#2481cc] text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>


      {/* TASK STAY COUNTDOWN ACTIVE TIMER HEADER ROW */}
      {runningTaskId && (
        <div className="bg-indigo-600 border border-indigo-500 rounded-lg p-3 text-center animate-pulse flex items-center justify-between shadow">
          <span className="text-xs text-white uppercase font-black tracking-wide flex items-center font-mono">
            <Timer className="w-4 h-4 mr-2 animate-spin" />
            Verification Timer Active
          </span>
          <span className="text-sm font-black text-white px-2.5 py-0.5 bg-slate-950/30 rounded font-mono">
            {timerSecondsLeft} Seconds Left
          </span>
        </div>
      )}


      {/* TASKS INDEX WALL cards lists */}
      <div className="space-y-2.5">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
          Available Tasks ({filteredTasks.length})
        </h3>

        {filteredTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center">
            <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">No active tasks found matching filter</p>
            <p className="text-[10px] text-slate-500 mt-1">Check back later or switch your profile mock context above!</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const userSubStatus = getSubStatus(task.id);
            const isTaskRunning = runningTaskId === task.id;

            return (
              <div 
                key={task.id} 
                className={`bg-slate-900 border p-3 rounded-lg flex items-center justify-between shadow-sm transition-all ${
                  task.isFeatured 
                    ? 'border-[#2481cc]/40 bg-gradient-to-r from-slate-900 via-slate-900 to-[#2481cc]/5' 
                    : 'border-slate-800'
                }`}
              >
                {/* Left hand details */}
                <div className="flex items-start space-x-3 max-w-[70%]">
                  <div className="text-2xl mt-0.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 select-none">
                    {getTaskIcon(task.type)}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate leading-relaxed">
                      {task.title}
                    </span>
                    
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="text-[9px] text-[#2481cc] font-black bg-[#2481cc]/10 border border-[#2481cc]/20 px-1.5 py-0.2 rounded font-sans">
                        {task.rewardAmount} {task.rewardType === 'coins' ? 'Coins' : 'BDT'}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {task.completedCount}/{task.userLimit} Slots
                      </span>
                      {task.viewRequirementSeconds && (
                        <span className="text-[9px] text-indigo-400 font-mono">
                          ⏱️ {task.viewRequirementSeconds}s stay
                        </span>
                      )}
                    </div>

                    {task.customRequirements && (
                      <span className="text-[9px] text-slate-500 mt-1 italic truncate">
                        Req: {task.customRequirements}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right hand interactive triggers */}
                <div>
                  {userSubStatus === 'approved' ? (
                    <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Claimed
                    </span>
                  ) : userSubStatus === 'pending' ? (
                    <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center">
                      <Clock className="w-3 h-3 mr-1 animate-pulse" />
                      Pending
                    </span>
                  ) : userSubStatus === 'rejected' ? (
                    <button 
                      id={`retry-task-${task.id}`}
                      onClick={() => handleStartTaskLink(task)}
                      className="text-[10px] text-rose-400 font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-1 rounded-full flex items-center"
                      title="Previously rejected. Click to retry."
                    >
                      Retry
                    </button>
                  ) : (
                    <button
                      id={`start-task-${task.id}`}
                      onClick={() => handleStartTaskLink(task)}
                      disabled={isTaskRunning}
                      className={`text-[11px] font-extrabold px-3 py-1.5 rounded-lg flex items-center justify-center transition-all ${
                        isTaskRunning 
                          ? 'bg-indigo-600 text-white cursor-wait animate-pulse' 
                          : 'bg-[#2481cc] hover:bg-[#1a66a3] active:bg-[#124b78] text-white'
                      }`}
                    >
                      {isTaskRunning ? 'Staging...' : 'RUN'}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>


      {/* 5. USER SUBMISSIONS DETAILED TRACK LIST */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center">
          <FileText className="w-4 h-4 mr-1.5 text-slate-400" />
          My Claim Verification Logs
        </h3>

        {submissions.length === 0 ? (
          <div className="py-6 text-center text-[10px] text-slate-500">
            No submissions recorded yet. Run a task to register logs.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-slate-200 truncate max-w-[200px]">
                    {sub.taskTitle}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded font-sans ${
                    sub.status === 'approved' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : sub.status === 'rejected' 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                  <span>Earned: +{sub.rewardAmount} {sub.rewardType === 'coins' ? 'COINS' : 'BDT'}</span>
                  <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                </div>

                {sub.status === 'rejected' && sub.rejectionReason && (
                  <div className="mt-1.5 bg-rose-950/20 text-rose-400 p-1.5 rounded text-[9px] border border-rose-500/10">
                    ❌ Reason: {sub.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>


      {/* --- PROOF EVIDENCE SUBMISSION POPUP FORM --- */}
      {submitTask && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <form 
            id="task-proof-form"
            onSubmit={handleProofSubmit} 
            className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-left"
          >
            
            <button 
              id="close-proof-modal"
              type="button"
              onClick={() => setSubmitTask(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Upload Work Evidence</h3>
            <p className="text-[11px] bg-slate-950 p-2 text-indigo-400 rounded leading-relaxed border border-slate-850 mb-4 font-mono">
              Task: "{submitTask.title}"
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  1. Your telegram Handle / User proof text
                </label>
                <input 
                  id="proof-text-handle shadow"
                  type="text"
                  required
                  placeholder="e.g. Username: @ryan_dev or post link code"
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              {submitTask.screenshotRequired && (
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    2. Proof Screenshot URL (Simulation Upload)
                  </label>
                  <input 
                    id="proof-screenshot-url"
                    type="url"
                    placeholder="Enter image URL, e.g. https://imgur.com/screenshot"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc] font-mono text-[11px]"
                  />
                  <p className="text-[9px] text-slate-500 mt-1 italic leading-relaxed">
                    A mock demo image will be automatically loaded if left empty. Check details carefully.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button 
                id="cancel-proof-btn"
                type="button"
                onClick={() => setSubmitTask(null)}
                className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                id="submit-proof-btn"
                type="submit"
                disabled={submittingPrf}
                className="w-1/2 bg-[#2481cc] hover:bg-[#1a66a3] active:bg-[#134d7c] disabled:opacity-50 text-white font-black py-2 rounded-lg text-xs flex items-center justify-center tracking-wider uppercase"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {submittingPrf ? "SENDING..." : "SEND PROOF"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
