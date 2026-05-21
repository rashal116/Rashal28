export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  telegramId: string;
  avatarUrl?: string;
  mainBalance: number;       // Direct withdrawable money (BDT)
  coinBalance: number;       // In-game reward coins
  depositBalance: number;    // Balance to spend on uploading user tasks (BDT)
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'King';
  level: number;
  exp: number;
  dailyStreak: number;
  lastCheckIn?: string;
  banned: boolean;
  isVIP: boolean;
  createdAt: string;
  ipAddress?: string;
  vpnUsed?: boolean;
}

export type TaskType = 
  | 'telegram_join' 
  | 'telegram_view' 
  | 'youtube_sub' 
  | 'twitter_follow' 
  | 'website_visit' 
  | 'app_download' 
  | 'custom';

export interface Task {
  id: string;
  creatorId: string; // 'admin' or user id
  creatorName: string;
  type: TaskType;
  title: string;
  rewardAmount: number; // in internal BDT or coins
  rewardType: 'coins' | 'cash';
  channelLink: string;
  userLimit: number;
  completedCount: number;
  status: 'active' | 'completed' | 'paused';
  isFeatured: boolean;
  createdAt: string;
  viewRequirementSeconds?: number; // e.g., view website for 15s
  customRequirements?: string;    // specific instructions
  screenshotRequired?: boolean;
}

export interface UserTaskSubmission {
  id: string;
  userId: string;
  username: string;
  taskId: string;
  taskTitle: string;
  taskType: TaskType;
  rewardAmount: number;
  rewardType: 'coins' | 'cash';
  status: 'pending' | 'approved' | 'rejected';
  proofText?: string;
  proofUrl?: string; // in our system, simple mock uploaded file string or comment
  submittedAt: string;
  rejectionReason?: string;
}

export type WithdrawMethod = 'bkash' | 'nagad' | 'rocket' | 'binance' | 'usdt';

export interface WithdrawRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  method: WithdrawMethod;
  info: string; // Phone number or wallet address
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

export type TransactionType = 
  | 'earn' 
  | 'deposit' 
  | 'withdraw' 
  | 'transfer' 
  | 'spin' 
  | 'daily_bonus' 
  | 'mining' 
  | 'task_creation' 
  | 'refund'
  | 'scratch';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceType: 'main' | 'coins' | 'deposit';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface MiningState {
  userId: string;
  miningActive: boolean;
  miningSpeedPerHour: number; // in coins
  lastClaimTime: string;
  unclaimedMinedCoins: number;
  activeMinerIndex: number;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_approved' | 'task_rejected' | 'withdraw_success' | 'bonus_alert' | 'general';
  read: boolean;
  createdAt: string;
}

export interface LeaderboardUser {
  username: string;
  firstName: string;
  coins: number;
  level: number;
  referrals: number;
}

export interface AppStatistics {
  totalUsers: number;
  totalTasksCompleted: number;
  totalWithdrawn: number;
  totalDeposited: number;
  activeTasks: number;
}
