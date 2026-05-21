import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  User, 
  Task, 
  UserTaskSubmission, 
  WithdrawRequest, 
  Transaction, 
  MiningState, 
  SystemNotification,
  LeaderboardUser,
  AppStatistics,
  TaskType,
  WithdrawMethod
} from "./src/types";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "server_db.json");

// Define state structure
interface DBState {
  users: Record<string, User>;
  tasks: Task[];
  submissions: UserTaskSubmission[];
  withdrawals: WithdrawRequest[];
  transactions: Transaction[];
  mining: Record<string, MiningState>;
  notifications: SystemNotification[];
  promoCodes: Record<string, { rewardAmount: number, rewardType: 'coins' | 'cash' | 'deposit', maxUses: number, currentUses: number, claimedBy: string[] }>;
}

let state: DBState = {
  users: {},
  tasks: [],
  submissions: [],
  withdrawals: [],
  transactions: [],
  mining: {},
  notifications: [],
  promoCodes: {
    "SUPERSPIN": { rewardAmount: 1000, rewardType: "coins", maxUses: 100, currentUses: 0, claimedBy: [] },
    "FREEBDT": { rewardAmount: 50, rewardType: "cash", maxUses: 50, currentUses: 0, claimedBy: [] },
    "DEPOSIT100": { rewardAmount: 100, rewardType: "deposit", maxUses: 200, currentUses: 0, claimedBy: [] },
    "WELCOME": { rewardAmount: 500, rewardType: "coins", maxUses: 500, currentUses: 0, claimedBy: [] }
  }
};

// Load default or saved state
function loadState() {
  try {
    if (fs.existsSync(DB_FILE)) {
      state = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      console.log("Loaded existing local database state from", DB_FILE);
    } else {
      console.log("No existing database. Initializing default simulated data...");
      initializeDefaultData();
      saveState();
    }
  } catch (err) {
    console.error("Error loading state, initializing blank default", err);
    initializeDefaultData();
  }
}

function saveState() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save state:", err);
  }
}

function initializeDefaultData() {
  // Setup demo users
  const demoUsers: User[] = [
    {
      id: "user_admin",
      username: "admin_dev",
      firstName: "Super",
      lastName: "Admin",
      telegramId: "7777777",
      mainBalance: 5000.0,
      coinBalance: 25000,
      depositBalance: 2000.0,
      referralCode: "ADMINREF",
      referralCount: 12,
      rank: "King",
      level: 10,
      exp: 4200,
      dailyStreak: 5,
      lastCheckIn: new Date().toISOString().split('T')[0],
      banned: false,
      isVIP: true,
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "user_demo",
      username: "earn_master",
      firstName: "Kabir",
      lastName: "Ahmed",
      telegramId: "12345678",
      mainBalance: 120.50,
      coinBalance: 1500,
      depositBalance: 150.00,
      referralCode: "KABIR50",
      referralCount: 4,
      referredBy: "ADMINREF",
      rank: "Bronze",
      level: 2,
      exp: 350,
      dailyStreak: 2,
      lastCheckIn: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
      banned: false,
      isVIP: false,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "user_active",
      username: "top_earner",
      firstName: "Sajib",
      lastName: "Hasan",
      telegramId: "98765432",
      mainBalance: 850.00,
      coinBalance: 8500,
      depositBalance: 50.00,
      referralCode: "SAJIB99",
      referralCount: 15,
      referredBy: "KABIR50",
      rank: "Silver",
      level: 4,
      exp: 1250,
      dailyStreak: 8,
      lastCheckIn: new Date().toISOString().split('T')[0],
      banned: false,
      isVIP: false,
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    }
  ];

  demoUsers.forEach(u => {
    state.users[u.id] = u;
    // Initial mining setups
    state.mining[u.id] = {
      userId: u.id,
      miningActive: false,
      miningSpeedPerHour: 20,
      lastClaimTime: new Date().toISOString(),
      unclaimedMinedCoins: 0,
      activeMinerIndex: 0
    };
  });

  // Default tasks (System Tasks created by Admin)
  const defaultTasks: Task[] = [
    {
      id: "task_1",
      creatorId: "admin",
      creatorName: "Official Task",
      type: "telegram_join",
      title: "Join Google AI Studio Official Channel",
      rewardAmount: 500,
      rewardType: "coins",
      channelLink: "https://t.me/google_ai_studio",
      userLimit: 5000,
      completedCount: 1240,
      status: "active",
      isFeatured: true,
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "task_2",
      creatorId: "admin",
      creatorName: "Official Task",
      type: "telegram_view",
      title: "View Latest Update Post (Stay 15 Seconds)",
      rewardAmount: 150,
      rewardType: "coins",
      channelLink: "https://t.me/telegram/1283",
      userLimit: 2000,
      completedCount: 890,
      status: "active",
      isFeatured: true,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      viewRequirementSeconds: 15
    },
    {
      id: "task_3",
      creatorId: "admin",
      creatorName: "Official Task",
      type: "youtube_sub",
      title: "Subscribe to Google DeepMind YouTube Channel",
      rewardAmount: 600,
      rewardType: "coins",
      channelLink: "https://youtube.com/@googledeepmind",
      userLimit: 1000,
      completedCount: 412,
      status: "active",
      isFeatured: false,
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "task_4",
      creatorId: "admin",
      creatorName: "Official Task",
      type: "twitter_follow",
      title: "Follow @Google on X/Twitter",
      rewardAmount: 300,
      rewardType: "coins",
      channelLink: "https://x.com/google",
      userLimit: 1500,
      completedCount: 610,
      status: "active",
      isFeatured: false,
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "task_5",
      creatorId: "admin",
      creatorName: "Official Task",
      type: "website_visit",
      title: "Explore Gemini Pro Documentation (Stay 20s)",
      rewardAmount: 2.50,
      rewardType: "cash",
      channelLink: "https://ai.google.dev/gemini-api/docs",
      userLimit: 800,
      completedCount: 150,
      status: "active",
      isFeatured: true,
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      viewRequirementSeconds: 20
    },
    {
      id: "task_6",
      creatorId: "user_demo",
      creatorName: "earn_master",
      type: "custom",
      title: "Testing Custom Task: Join My Crypto Discussion Hub",
      rewardAmount: 400,
      rewardType: "coins",
      channelLink: "https://t.me/demo_discussion_hub",
      userLimit: 100,
      completedCount: 45,
      status: "active",
      isFeatured: false,
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      customRequirements: "Join, post a hello sticker, do not leave for 3 days.",
      screenshotRequired: true
    }
  ];

  state.tasks = defaultTasks;

  // Let's create some demo submissions
  state.submissions = [
    {
      id: "sub_1",
      userId: "user_active",
      username: "top_earner",
      taskId: "task_1",
      taskTitle: "Join Google AI Studio Official Channel",
      taskType: "telegram_join",
      rewardAmount: 500,
      rewardType: "coins",
      status: "approved",
      submittedAt: new Date(Date.now() - 3600_000 * 10).toISOString()
    },
    {
      id: "sub_2",
      userId: "user_demo",
      username: "earn_master",
      taskId: "task_6",
      taskTitle: "Testing Custom Task: Join My Crypto Discussion Hub",
      taskType: "custom",
      rewardAmount: 400,
      rewardType: "coins",
      status: "pending",
      proofText: "Username: @demo_user_123. Checked in successfully.",
      proofUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=250&q=80",
      submittedAt: new Date(Date.now() - 3600_000 * 2).toISOString()
    },
    {
      id: "sub_3",
      userId: "user_active",
      username: "top_earner",
      taskId: "task_6",
      taskTitle: "Testing Custom Task: Join My Crypto Discussion Hub",
      taskType: "custom",
      rewardAmount: 400,
      rewardType: "coins",
      status: "pending",
      proofText: "Completed join @active_t",
      proofUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&h=250&q=80",
      submittedAt: new Date(Date.now() - 1200_000).toISOString()
    }
  ];

  // Mock withdrawals
  state.withdrawals = [
    {
      id: "w_1",
      userId: "user_active",
      username: "top_earner",
      amount: 450,
      method: "bkash",
      info: "017XXXXXXXX",
      status: "approved",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 1.8 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "w_2",
      userId: "user_demo",
      username: "earn_master",
      amount: 100,
      method: "nagad",
      info: "019XXXXXXXX",
      status: "pending",
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    }
  ];

  // Mock transactions
  state.transactions = [
    {
      id: "tx_1",
      userId: "user_demo",
      type: "deposit",
      amount: 150,
      balanceType: "deposit",
      description: "bKash Deposit Approved",
      status: "completed",
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "tx_2",
      userId: "user_demo",
      type: "earn",
      amount: 500,
      balanceType: "coins",
      description: "Welcome Promo Code claimed",
      status: "completed",
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "tx_3",
      userId: "user_active",
      type: "withdraw",
      amount: 450,
      balanceType: "main",
      description: "bKash Withdraw Processing",
      status: "completed",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Default notifications
  state.notifications = [
    {
      id: "n_1",
      userId: "user_active",
      title: "Withdrawal Approved! 🎉",
      message: "Your bKash withdrawal of 450 BDT has been successfully sent.",
      type: "withdraw_success",
      read: false,
      createdAt: new Date(Date.now() - 1.8 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "n_2",
      userId: "user_demo",
      title: "Daily Bonus Alert!",
      message: "Don't forget to claim your Daily Check-In coins to maintain your 2-day streak!",
      type: "bonus_alert",
      read: false,
      createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
    }
  ];
}

async function startServer() {
  loadState();

  const app = express();
  app.use(express.json());

  // Log active requests
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  // ---- API MIDDLEWARE FOR EXTRACTING USER ----
  // For simulated authentication, users send user-id header
  const getRequestUser = (req: express.Request): User | null => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return null;
    return state.users[userId] || null;
  };

  // ---- 1. AUTH API ----
  app.post("/api/auth/telegram", (req, res) => {
    const { telegramId, username, firstName, lastName, photoUrl, referralCode } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ error: "Telegram ID is required" });
    }

    // Check if user exists
    let user = Object.values(state.users).find(u => u.telegramId === String(telegramId));

    if (!user) {
      // Create new user
      const newId = `user_${telegramId || Date.now()}`;
      const uRefCode = `REF${String(telegramId).slice(-4).toUpperCase() || Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      let referredBy: string | undefined;
      if (referralCode) {
        const parentUser = Object.values(state.users).find(u => u.referralCode === referralCode);
        if (parentUser) {
          referredBy = parentUser.id;
          parentUser.referralCount += 1;
          parentUser.coinBalance += 200; // instant coin referral reward
          
          // Add notification to referrer
          state.notifications.push({
            id: `n_ref_${Date.now()}`,
            userId: parentUser.id,
            title: "New Referral registered! 👥",
            message: `@${username || "User"} joined using your link. You earned 200 simulation coins!`,
            type: "bonus_alert",
            read: false,
            createdAt: new Date().toISOString()
          });

          // Record referrer transaction
          state.transactions.push({
            id: `tx_ref_${Date.now()}`,
            userId: parentUser.id,
            type: "earn",
            amount: 200,
            balanceType: "coins",
            description: `Referral signup: @${username || "User"}`,
            status: "completed",
            createdAt: new Date().toISOString()
          });
        }
      }

      user = {
        id: newId,
        username: username || `tg_${telegramId}`,
        firstName: firstName || "Telegram",
        lastName: lastName || "User",
        telegramId: String(telegramId),
        avatarUrl: photoUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&h=150&q=80",
        mainBalance: 10.0, // free 10 BDT welcome gift
        coinBalance: 500,  // free 500 coins starter pack
        depositBalance: 0.0,
        referralCode: uRefCode,
        referredBy,
        referralCount: 0,
        rank: "Bronze",
        level: 1,
        exp: 0,
        dailyStreak: 0,
        banned: false,
        isVIP: false,
        createdAt: new Date().toISOString()
      };

      state.users[newId] = user;

      // Seed setup for mining
      state.mining[newId] = {
        userId: newId,
        miningActive: false,
        miningSpeedPerHour: 20,
        lastClaimTime: new Date().toISOString(),
        unclaimedMinedCoins: 0,
        activeMinerIndex: 0
      };

      // Add system welcome notifications
      state.notifications.push({
        id: `n_welcome_${newId}`,
        userId: newId,
        title: "Welcome onboard! 🚀",
        message: "Enjoy a free 10 BDT welcome balance & 500 Coins. Go to Earn Tasks tab to start earning more BDT real money mock credits!",
        type: "general",
        read: false,
        createdAt: new Date().toISOString()
      });

      saveState();
    } else {
      // Simulate real-time level/rank upgrade checks
      updateUserRankAndLevel(user);
    }

    res.json({ user, message: "Logged in successfully" });
  });

  // Fetch logged in profile details
  app.get("/api/user/profile", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    if (user.banned) {
      return res.status(403).json({ error: "Your account is banned for malicious activity (anti-spam trigger)" });
    }

    // Refresh dynamic mining coins
    const mining = state.mining[user.id];
    if (mining && mining.miningActive) {
      const now = Date.now();
      const last = new Date(mining.lastClaimTime).getTime();
      const hoursDiff = (now - last) / (3600 * 1000);
      const earned = Math.min(24, hoursDiff) * mining.miningSpeedPerHour; // max 24h accumulation
      mining.unclaimedMinedCoins = Math.floor(earned);
    }

    // Make sure we have latest rank and level
    updateUserRankAndLevel(user);
    saveState();

    res.json({
      user,
      mining: state.mining[user.id] || null,
      notificationsCount: state.notifications.filter(n => n.userId === user.id && !n.read).length
    });
  });

  // Daily check-in logic
  app.post("/api/user/daily-checkin", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const todayStr = new Date().toISOString().split('T')[0];
    
    if (user.lastCheckIn === todayStr) {
      return res.status(400).json({ error: "You already claimed your check-in reward today! Come back tomorrow." });
    }

    const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
    let newStreak = 1;
    if (user.lastCheckIn === yesterdayStr) {
      newStreak = (user.dailyStreak % 7) + 1;
    }

    // Reward calculations: coins increases with streak
    const baseCoins = 100;
    const bonusCoins = newStreak * 50;
    const totalCoins = baseCoins + bonusCoins;
    const expReward = 50 + newStreak * 10;

    user.dailyStreak = newStreak;
    user.lastCheckIn = todayStr;
    user.coinBalance += totalCoins;
    user.exp += expReward;

    state.transactions.push({
      id: `tx_streak_${Date.now()}`,
      userId: user.id,
      type: "daily_bonus",
      amount: totalCoins,
      balanceType: "coins",
      description: `Daily Check-In Reward (Day ${newStreak})`,
      status: "completed",
      createdAt: new Date().toISOString()
    });

    state.notifications.push({
      id: `n_streak_${Date.now()}`,
      userId: user.id,
      title: "Daily Bonus Claimed! 📅",
      message: `Checked in successfully (Day ${newStreak} Streak). Earned +${totalCoins} coins & +${expReward} EXP!`,
      type: "bonus_alert",
      read: false,
      createdAt: new Date().toISOString()
    });

    updateUserRankAndLevel(user);
    saveState();

    res.json({ 
      success: true, 
      coinsEarned: totalCoins, 
      streak: newStreak, 
      user 
    });
  });

  // Claim Gift Promo Code
  app.post("/api/user/claim-giftcode", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const codeInput = String(req.body.code || "").toUpperCase().trim();
    const promo = state.promoCodes[codeInput];

    if (!promo) {
      return res.status(404).json({ error: "Invalid Gift or Promo Code" });
    }

    if (promo.claimedBy.includes(user.id)) {
      return res.status(400).json({ error: "You have already claimed this Promo Code." });
    }

    if (promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ error: "This promo code utilization limit has been reached!" });
    }

    promo.currentUses += 1;
    promo.claimedBy.push(user.id);

    let amount = promo.rewardAmount;
    let desc = `Promo Code: ${codeInput}`;

    if (promo.rewardType === "coins") {
      user.coinBalance += amount;
      state.transactions.push({
        id: `tx_promo_${Date.now()}`,
        userId: user.id,
        type: "earn",
        amount,
        balanceType: "coins",
        description: desc,
        status: "completed",
        createdAt: new Date().toISOString()
      });
    } else if (promo.rewardType === "cash") {
      user.mainBalance += amount;
      state.transactions.push({
        id: `tx_promo_${Date.now()}`,
        userId: user.id,
        type: "earn",
        amount,
        balanceType: "main",
        description: desc,
        status: "completed",
        createdAt: new Date().toISOString()
      });
    } else if (promo.rewardType === "deposit") {
      user.depositBalance += amount;
      state.transactions.push({
        id: `tx_promo_${Date.now()}`,
        userId: user.id,
        type: "deposit",
        amount,
        balanceType: "deposit",
        description: desc,
        status: "completed",
        createdAt: new Date().toISOString()
      });
    }

    state.notifications.push({
      id: `n_promo_${Date.now()}`,
      userId: user.id,
      title: "Promo Code Applied! 🎁",
      message: `Applied ${codeInput} successfully! Added +${amount} ${promo.rewardType === "coins" ? "coins" : "BDT"} to your balance.`,
      type: "bonus_alert",
      read: false,
      createdAt: new Date().toISOString()
    });

    updateUserRankAndLevel(user);
    saveState();

    res.json({ success: true, message: "Promo Code claimed successfully", rewardAmount: amount, rewardType: promo.rewardType, user });
  });

  // Buy VIP Membership using main balance
  app.post("/api/user/buy-vip", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.isVIP) {
      return res.status(400).json({ error: "You are already a VIP Member!" });
    }

    const vipPrice = 250; // 250 BDT
    if (user.mainBalance < vipPrice) {
      return res.status(400).json({ error: "Insufficient Main Balance. VIP requires 250 BDT." });
    }

    user.mainBalance -= vipPrice;
    user.isVIP = true;

    // Upgrade mining speeds and levels
    const mining = state.mining[user.id];
    if (mining) {
      mining.miningSpeedPerHour = 50; // Standard 20 -> 50 speed VIP boosts!
    }

    state.transactions.push({
      id: `tx_vip_${Date.now()}`,
      userId: user.id,
      type: "withdraw",
      amount: vipPrice,
      balanceType: "main",
      description: "VIP Membership Upgrade Purchase",
      status: "completed",
      createdAt: new Date().toISOString()
    });

    state.notifications.push({
      id: `n_vip_${Date.now()}`,
      userId: user.id,
      title: "VIP Activated! 👑",
      message: `Welcome to the VIP Club! Your mining speed has increased to 50 coins/hr, and custom task upload fees are discounted!`,
      type: "general",
      read: false,
      createdAt: new Date().toISOString()
    });

    saveState();
    res.json({ success: true, user, mining });
  });


  // ---- 2. TASKS API ----
  app.get("/api/tasks", (req, res) => {
    const user = getRequestUser(req);
    // Show only active tasks, plus filter completed ones if we want (actually, client can filter)
    const activeTasks = state.tasks.filter(t => t.status === "active");
    res.json({ tasks: activeTasks });
  });

  // Create customized tasks (By normal users using Deposit Balance, or admins)
  app.post("/api/tasks/create", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { type, title, rewardAmount, rewardType, channelLink, userLimit, customRequirements, screenshotRequired } = req.body;

    if (!type || !title || !rewardAmount || !channelLink || !userLimit) {
      return res.status(400).json({ error: "Missing required custom task fields" });
    }

    const totalCost = Number(rewardAmount) * Number(userLimit);
    
    // Auto Task Anti-Spam checks
    if (totalCost <= 0 || Number(rewardAmount) < 0.1 || Number(userLimit) < 5) {
      return res.status(400).json({ error: "Invalid task specs. Min reward is 0.1 BDT and min user limit is 5." });
    }

    // VIP gets discount on platforms, standard has small flat platform charge (e.g. 10 BDT)
    const serviceFee = user.isVIP ? 0 : 5;
    const grandCost = totalCost + serviceFee;

    if (user.depositBalance < grandCost) {
      return res.status(400).json({ 
        error: `Insufficient Deposit Balance. Creating this task requires ${grandCost.toFixed(2)} BDT (Cost: ${totalCost} BDT + Service Fee: ${serviceFee} BDT). Please deposit funds first in the Wallet panel.`
      });
    }

    user.depositBalance -= grandCost;

    const newTask: Task = {
      id: `task_custom_${Date.now()}`,
      creatorId: user.id,
      creatorName: user.username,
      type: type as TaskType,
      title: String(title),
      rewardAmount: Number(rewardAmount),
      rewardType: rewardType || 'coins',
      channelLink: String(channelLink),
      userLimit: Number(userLimit),
      completedCount: 0,
      status: "active",
      isFeatured: false,
      createdAt: new Date().toISOString(),
      customRequirements: customRequirements ? String(customRequirements) : undefined,
      screenshotRequired: !!screenshotRequired
    };

    state.tasks.push(newTask);

    state.transactions.push({
      id: `tx_create_task_${Date.now()}`,
      userId: user.id,
      type: "task_creation",
      amount: grandCost,
      balanceType: "deposit",
      description: `Uploaded task: "${title}"`,
      status: "completed",
      createdAt: new Date().toISOString()
    });

    state.notifications.push({
      id: `n_create_task_${Date.now()}`,
      userId: user.id,
      title: "Task Web-Form Live! 🚀",
      message: `Your task "${title}" is now active and live for other users to complete! Check analytics anytime.`,
      type: "general",
      read: false,
      createdAt: new Date().toISOString()
    });

    saveState();
    res.json({ success: true, task: newTask, user });
  });

  // Submit proof for active task
  app.post("/api/tasks/submit", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { taskId, proofText, proofUrl } = req.body;
    const task = state.tasks.find(t => t.id === taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.status !== "active") {
      return res.status(400).json({ error: "This task is no longer active" });
    }

    // Check if user already submitted
    const existingSubmission = state.submissions.find(s => s.userId === user.id && s.taskId === taskId);
    if (existingSubmission) {
      return res.status(400).json({ error: "You have already submitted proof for this task, status: " + existingSubmission.status });
    }

    // Auto verification engine for simple links
    const requiresManualApproval = task.screenshotRequired || task.creatorId !== "admin" || task.type === "custom";
    
    const newSubmission: UserTaskSubmission = {
      id: `sub_${Date.now()}`,
      userId: user.id,
      username: user.username,
      taskId: task.id,
      taskTitle: task.title,
      taskType: task.type,
      rewardAmount: task.rewardAmount,
      rewardType: task.rewardType,
      status: "pending",
      proofText: proofText ? String(proofText) : undefined,
      proofUrl: proofUrl ? String(proofUrl) : undefined,
      submittedAt: new Date().toISOString()
    };

    // Auto-verify if flat official and doesn't require complex evidence!
    if (!requiresManualApproval) {
      newSubmission.status = "approved";
      state.submissions.push(newSubmission);

      // Instantly pay
      if (task.rewardType === "coins") {
        user.coinBalance += task.rewardAmount;
        user.exp += 30; // 30 XP
      } else {
        user.mainBalance += task.rewardAmount;
        user.exp += 40; // 40 XP
      }

      task.completedCount += 1;
      if (task.completedCount >= task.userLimit) {
        task.status = "completed"; // auto-stop task limits
      }

      // Record direct earn transaction
      state.transactions.push({
        id: `tx_earn_task_${Date.now()}`,
        userId: user.id,
        type: "earn",
        amount: task.rewardAmount,
        balanceType: task.rewardType === "coins" ? "coins" : "main",
        description: `Completed: ${task.title} (Auto-verified)`,
        status: "completed",
        createdAt: new Date().toISOString()
      });

      state.notifications.push({
        id: `n_earn_${Date.now()}`,
        userId: user.id,
        title: "Task Approved instantly! ✔️",
        message: `Your task "${task.title}" was instantly approved. +${task.rewardAmount} ${task.rewardType === "coins" ? "Coins" : "BDT"} credited!`,
        type: "task_approved",
        read: false,
        createdAt: new Date().toISOString()
      });

      updateUserRankAndLevel(user);
    } else {
      // Manual approval queued (either User custom task or custom admin tasks)
      state.submissions.push(newSubmission);

      state.notifications.push({
        id: `n_queued_${Date.now()}`,
        userId: user.id,
        title: "Proof Sent for Verification ⌛",
        message: `Your submission for "${task.title}" is queued for approval by the host.`,
        type: "general",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    saveState();
    res.json({ success: true, submission: newSubmission, user });
  });

  // Get user completed tasks/submissions
  app.get("/api/user/submissions", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const subs = state.submissions.filter(s => s.userId === user.id);
    res.json({ submissions: subs });
  });

  // Fetch created tasks with analytics
  app.get("/api/tasks/my-created", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const myTasks = state.tasks.filter(t => t.creatorId === user.id);
    
    // Add analytics for completed count vs limit, pending proof count etc.
    const tasksWithAnalytics = myTasks.map(t => {
      const pendingCount = state.submissions.filter(s => s.taskId === t.id && s.status === "pending").length;
      return {
        ...t,
        analytics: {
          pendingApprovals: pendingCount,
          completedCount: t.completedCount,
          userLimit: t.userLimit,
          stopStatus: t.status
        }
      };
    });

    res.json({ tasks: tasksWithAnalytics });
  });


  // ---- 3. BONUS GAMES API ----
  // Spin Wheel Game
  app.post("/api/games/spin", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const cost = 100; // 100 coins
    if (user.coinBalance < cost) {
      return res.status(400).json({ error: "Insufficient Coin Balance. Each spin costs 100 coins." });
    }

    // Deduct coins
    user.coinBalance -= cost;

    // Spin awards
    // Values: BDT or Coin bonuses
    const items = [
      { type: 'coins', amount: 50, label: '50 Coins' },
      { type: 'coins', amount: 200, label: '200 Coins' },
      { type: 'cash', amount: 2, label: '2 BDT Cash' },
      { type: 'coins', amount: 500, label: '500 Coins' },
      { type: 'cash', amount: 5, label: '5 BDT Cash' },
      { type: 'coins', amount: 1000, label: '1,000 Coins 🏆' },
      { type: 'cash', amount: 20, label: '20 BDT Cash 🌟' },
      { type: 'coins', amount: 0, label: 'Better luck next time!' }
    ];

    const idx = Math.floor(Math.random() * items.length);
    const wonItem = items[idx];

    if (wonItem.type === 'coins' && wonItem.amount > 0) {
      user.coinBalance += wonItem.amount;
    } else if (wonItem.type === 'cash' && wonItem.amount > 0) {
      user.mainBalance += wonItem.amount;
    }

    // Transaction history
    state.transactions.push({
      id: `tx_spin_${Date.now()}`,
      userId: user.id,
      type: "spin",
      amount: wonItem.amount,
      balanceType: wonItem.type === 'coins' ? 'coins' : 'main',
      description: `Lucky Spin result: Won ${wonItem.label}`,
      status: "completed",
      createdAt: new Date().toISOString()
    });

    // Alert
    state.notifications.push({
      id: `n_spin_${Date.now()}`,
      userId: user.id,
      title: "Wheel spun! 🎡",
      message: `You won ${wonItem.label} from the Lucky Spin wheel!`,
      type: "bonus_alert",
      read: false,
      createdAt: new Date().toISOString()
    });

    updateUserRankAndLevel(user);
    saveState();

    res.json({ success: true, rewardIndex: idx, wonItem, user });
  });

  // Scratch Cards Game
  app.post("/api/games/scratch", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const cost = 50; // 50 coins to buy a card
    if (user.coinBalance < cost) {
      return res.status(400).json({ error: "Insufficient Coin Balance. Each scratch card costs 50 coins." });
    }

    user.coinBalance -= cost;

    // Possible winnings
    const rewards = [
      { type: 'coins', amount: 10, label: '10 Coins' },
      { type: 'coins', amount: 80, label: '80 Coins' },
      { type: 'coins', amount: 150, label: '150 Coins' },
      { type: 'cash', amount: 1.5, label: '1.5 BDT Cash' },
      { type: 'cash', amount: 10, label: '10 BDT Cash 🎉' },
      { type: 'coins', amount: 0, label: 'Oops, empty card' }
    ];

    const item = rewards[Math.floor(Math.random() * rewards.length)];

    if (item.type === 'coins' && item.amount > 0) {
      user.coinBalance += item.amount;
    } else if (item.type === 'cash' && item.amount > 0) {
      user.mainBalance += item.amount;
    }

    state.transactions.push({
      id: `tx_scratch_${Date.now()}`,
      userId: user.id,
      type: "scratch",
      amount: item.amount,
      balanceType: item.type === 'coins' ? 'coins' : 'main',
      description: `Scrached: ${item.label}`,
      status: "completed",
      createdAt: new Date().toISOString()
    });

    saveState();

    res.json({ success: true, wonItem: item, user });
  });

  // Mining Engine Start
  app.post("/api/mining/start", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let mining = state.mining[user.id];
    if (!mining) {
      mining = {
        userId: user.id,
        miningActive: false,
        miningSpeedPerHour: user.isVIP ? 50 : 20,
        lastClaimTime: new Date().toISOString(),
        unclaimedMinedCoins: 0,
        activeMinerIndex: 0
      };
      state.mining[user.id] = mining;
    }

    if (mining.miningActive) {
      return res.status(400).json({ error: "Mining is already active and running!" });
    }

    mining.miningActive = true;
    mining.lastClaimTime = new Date().toISOString();
    mining.unclaimedMinedCoins = 0;

    saveState();
    res.json({ success: true, mining });
  });

  // Mining Claim Earned
  app.post("/api/mining/claim", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const mining = state.mining[user.id];
    if (!mining || !mining.miningActive) {
      return res.status(400).json({ error: "No active mining session found to claim!" });
    }

    const now = Date.now();
    const last = new Date(mining.lastClaimTime).getTime();
    const hoursDiff = (now - last) / (3600 * 1000);
    // Limit to max 24 hours of idling time accumulation
    const finalHours = Math.min(24, hoursDiff);
    const claimable = Math.floor(finalHours * mining.miningSpeedPerHour);

    if (claimable <= 0) {
      return res.status(400).json({ error: "Nothing mined yet. Please wait to mine at least 1 coin!" });
    }

    user.coinBalance += claimable;
    user.exp += Math.ceil(claimable * 0.1); // XP boost too

    // Record action
    state.transactions.push({
      id: `tx_mine_${Date.now()}`,
      userId: user.id,
      type: "mining",
      amount: claimable,
      balanceType: "coins",
      description: `Claimed ${claimable} from active cloud miner`,
      status: "completed",
      createdAt: new Date().toISOString()
    });

    state.notifications.push({
      id: `n_mined_${Date.now()}`,
      userId: user.id,
      title: "Mining Cleared! ⛏️",
      message: `Successfully collected +${claimable} mined coins into your main wallet. Core running restarted!`,
      type: "bonus_alert",
      read: false,
      createdAt: new Date().toISOString()
    });

    // Reset mining timer
    mining.lastClaimTime = new Date().toISOString();
    mining.unclaimedMinedCoins = 0;
    mining.miningActive = false; // Stopped, needs manual restart loop

    updateUserRankAndLevel(user);
    saveState();

    res.json({ success: true, claimableAmount: claimable, mining, user });
  });


  // ---- 4. WALLET & FUNDS TRANSFERS ----
  // Deposit simulation (bKash nagad local deposits)
  app.post("/api/wallet/deposit", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { amount, method, senderNumber, txid } = req.body;

    if (!amount || !method || !senderNumber || !txid) {
      return res.status(400).json({ error: "Missing billing reference details. Fill up fields carefully." });
    }

    if (Number(amount) < 50) {
      return res.status(400).json({ error: "Minimum deposit amount is 50 BDT." });
    }

    // Auto verification deposit simulation (checks if txid has correct format length)
    if (txid.length < 8) {
      return res.status(400).json({ error: "Invalid Transaction TXID code format. Check transaction counter sms." });
    }

    const valAmount = Number(amount);
    user.depositBalance += valAmount;

    state.transactions.push({
      id: `tx_dep_${Date.now()}`,
      userId: user.id,
      type: "deposit",
      amount: valAmount,
      balanceType: "deposit",
      description: `Deposited BDT ${valAmount} via ${method} (TXID: ${txid})`,
      status: "completed",
      createdAt: new Date().toISOString()
    });

    state.notifications.push({
      id: `n_dep_${Date.now()}`,
      userId: user.id,
      title: "Deposit Loaded! 💎",
      message: `Your deposit of ${valAmount} BDT via ${method} has been processed instantly. Create custom tasks now!`,
      type: "general",
      read: false,
      createdAt: new Date().toISOString()
    });

    saveState();
    res.json({ success: true, deposited: valAmount, user });
  });

  // Withdraw simulation (nagad/bkash/binance withdraw forms)
  app.post("/api/wallet/withdraw", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { amount, method, info } = req.body;

    if (!amount || !method || !info) {
      return res.status(400).json({ error: "Missing withdrawal specifications. Specify withdraw target." });
    }

    const withdrawAmt = Number(amount);
    
    // Limits
    const minWithdraw = 100; // 100 BDT minimum withdrawal
    if (withdrawAmt < minWithdraw) {
      return res.status(400).json({ error: `Minimum withdraw limit is ${minWithdraw} BDT.` });
    }

    if (user.mainBalance < withdrawAmt) {
      return res.status(400).json({ error: `Insufficient main balance. You only have BDT ${user.mainBalance.toFixed(2)}` });
    }

    // Spend from Main Balance on submission
    user.mainBalance -= withdrawAmt;

    const newWithdraw: WithdrawRequest = {
      id: `w_req_${Date.now()}`,
      userId: user.id,
      username: user.username,
      amount: withdrawAmt,
      method: method as WithdrawMethod,
      info: String(info),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    state.withdrawals.push(newWithdraw);

    state.transactions.push({
      id: `tx_withdraw_${Date.now()}`,
      userId: user.id,
      type: "withdraw",
      amount: withdrawAmt,
      balanceType: "main",
      description: `Queued withdrawal to ${method}: ${info}`,
      status: "pending",
      createdAt: new Date().toISOString()
    });

    state.notifications.push({
      id: `n_withdraw_${Date.now()}`,
      userId: user.id,
      title: "Withdrawal Queued! ⌛",
      message: `Submitted payout order of ${withdrawAmt} BDT via ${method}. Approvals take up to 2 hours!`,
      type: "general",
      read: false,
      createdAt: new Date().toISOString()
    });

    saveState();
    res.json({ success: true, withdrawal: newWithdraw, user });
  });

  // Fetch transactions history
  app.get("/api/wallet/transactions", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Filter and sort descending
    const txs = state.transactions
      .filter(t => t.userId === user.id)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ transactions: txs });
  });

  // Fetch notifications
  app.get("/api/notifications", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const notes = state.notifications
      .filter(n => n.userId === user.id)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ notifications: notes });
  });

  // Read all notifications
  app.post("/api/notifications/read", (req, res) => {
    const user = getRequestUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    state.notifications.forEach(n => {
      if (n.userId === user.id) n.read = true;
    });

    saveState();
    res.json({ success: true });
  });


  // ---- 5. LEADERBOARD ----
  app.get("/api/leaderboard", (req, res) => {
    const sorted = Object.values(state.users)
      .sort((a, b) => b.coinBalance - a.coinBalance)
      .slice(0, 10)
      .map(u => ({
        username: u.username,
        firstName: u.firstName,
        coins: u.coinBalance,
        level: u.level,
        referrals: u.referralCount
      }));
    res.json({ leaderboard: sorted });
  });


  // ---- 6. ADMIN PORTAL CONTROLLERS ----
  // Read all general app stats
  app.get("/api/admin/stats", (req, res) => {
    const totalUsers = Object.keys(state.users).length;
    const totalTasksCompleted = state.submissions.filter(s => s.status === "approved").length;
    const totalWithdrawn = state.withdrawals
      .filter(w => w.status === "approved")
      .reduce((sum, w) => sum + w.amount, 0);
    const totalDeposited = state.transactions
      .filter(t => t.type === "deposit" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);
    const activeTasks = state.tasks.filter(t => t.status === "active").length;

    res.json({
      statistics: {
        totalUsers,
        totalTasksCompleted,
        totalWithdrawn,
        totalDeposited,
        activeTasks
      }
    });
  });

  // Get users database
  app.get("/api/admin/users", (req, res) => {
    res.json({ users: Object.values(state.users) });
  });

  // Ban/unban action
  app.post("/api/admin/user/ban", (req, res) => {
    const { targetUserId, banState } = req.body;
    const tgt = state.users[targetUserId];
    if (!tgt) return res.status(404).json({ error: "Target user not found" });

    tgt.banned = !!banState;
    saveState();
    res.json({ success: true, user: tgt });
  });

  // Get submissions queue
  app.get("/api/admin/submissions", (req, res) => {
    const pendings = state.submissions.filter(s => s.status === "pending");
    res.json({ submissions: pendings });
  });

  // Approve a Task submission
  app.post("/api/admin/submission/approve", (req, res) => {
    const { submissionId } = req.body;
    const sub = state.submissions.find(s => s.id === submissionId);
    if (!sub) return res.status(404).json({ error: "Proof submission ID not found" });

    if (sub.status !== "pending") {
      return res.status(400).json({ error: "This submission is already reviewed: " + sub.status });
    }

    const task = state.tasks.find(t => t.id === sub.taskId);
    if (!task) return res.status(404).json({ error: "Associated creator task was deleted" });

    const claimant = state.users[sub.userId];
    if (!claimant) return res.status(404).json({ error: "Claimant user account not found" });

    sub.status = "approved";
    task.completedCount += 1;
    if (task.completedCount >= task.userLimit) {
      task.status = "completed";
    }

    // Credits user
    let logDesc = `Approved Task completion: "${task.title}"`;
    if (sub.rewardType === "coins") {
      claimant.coinBalance += sub.rewardAmount;
      claimant.exp += 30;

      state.transactions.push({
        id: `tx_apprv_${Date.now()}`,
        userId: claimant.id,
        type: "earn",
        amount: sub.rewardAmount,
        balanceType: "coins",
        description: logDesc,
        status: "completed",
        createdAt: new Date().toISOString()
      });
    } else {
      claimant.mainBalance += sub.rewardAmount;
      claimant.exp += 40;

      state.transactions.push({
        id: `tx_apprv_${Date.now()}`,
        userId: claimant.id,
        type: "earn",
        amount: sub.rewardAmount,
        balanceType: "main",
        description: logDesc,
        status: "completed",
        createdAt: new Date().toISOString()
      });
    }

    // Notifications alert
    state.notifications.push({
      id: `n_apprv_${Date.now()}`,
      userId: claimant.id,
      title: "Proof Verified! ✔️",
      message: `Your proof for task "${task.title}" was approved by the host! +${sub.rewardAmount} ${sub.rewardType === "coins" ? "coins" : "BDT"} credited.`,
      type: "task_approved",
      read: false,
      createdAt: new Date().toISOString()
    });

    updateUserRankAndLevel(claimant);
    saveState();

    res.json({ success: true, submission: sub });
  });

  // Reject a Task submission
  app.post("/api/admin/submission/reject", (req, res) => {
    const { submissionId, reason } = req.body;
    const sub = state.submissions.find(s => s.id === submissionId);
    if (!sub) return res.status(404).json({ error: "Proof submission ID not found" });

    if (sub.status !== "pending") {
      return res.status(400).json({ error: "Submission was already reviewed" });
    }

    const task = state.tasks.find(t => t.id === sub.taskId);
    const claimant = state.users[sub.userId];

    sub.status = "rejected";
    sub.rejectionReason = reason || "Incomplete screenshot proof or invalid account handle.";

    if (claimant) {
      state.notifications.push({
        id: `n_rej_${Date.now()}`,
        userId: claimant.id,
        title: "Submission Rejected ❌",
        message: `Task submission for "${task ? task.title : 'Task'}" was rejected. Reason: ${sub.rejectionReason}`,
        type: "task_rejected",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    saveState();
    res.json({ success: true, submission: sub });
  });

  // Get withdraw queries
  app.get("/api/admin/withdraws", (req, res) => {
    res.json({ withdrawals: state.withdrawals.filter(w => w.status === "pending") });
  });

  // Approve a payout request
  app.post("/api/admin/withdraw/approve", (req, res) => {
    const { withdrawId } = req.body;
    const w = state.withdrawals.find(req => req.id === withdrawId);
    if (!w) return res.status(404).json({ error: "Withdraw requests not found" });

    if (w.status !== "pending") {
      return res.status(400).json({ error: "Withdraw is already handled" });
    }

    const owner = state.users[w.userId];

    w.status = "approved";
    w.processedAt = new Date().toISOString();

    // Set pending transactions of this user to complete
    const tx = state.transactions.find(t => t.userId === w.userId && t.type === "withdraw" && t.status === "pending" && t.amount === w.amount);
    if (tx) {
      tx.status = "completed";
    }

    if (owner) {
      state.notifications.push({
        id: `n_w_apprv_${Date.now()}`,
        userId: owner.id,
        title: "Payout Completed! 💰",
        message: `Your withdraw order of ${w.amount} BDT via ${w.method} is processed successfully. Check wallet.`,
        type: "withdraw_success",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    saveState();
    res.json({ success: true, withdraw: w });
  });

  // Send Broadcast notices
  app.post("/api/admin/broadcast", (req, res) => {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ error: "Check empty inputs" });

    const userList = Object.keys(state.users);
    userList.forEach(uid => {
      state.notifications.push({
        id: `n_broad_${uid}_${Date.now()}`,
        userId: uid,
        title: String(title),
        message: String(message),
        type: "general",
        read: false,
        createdAt: new Date().toISOString()
      });
    });

    saveState();
    res.json({ success: true, recipientsCount: userList.length });
  });

  // Admin add new Task
  app.post("/api/admin/config/add-task", (req, res) => {
    const { type, title, rewardAmount, rewardType, channelLink, userLimit, isFeatured, viewRequirementSeconds } = req.body;
    
    if (!type || !title || !rewardAmount || !channelLink || !userLimit) {
      return res.status(400).json({ error: "Missing admin task configuration fields" });
    }

    const sysTask: Task = {
      id: `task_sys_${Date.now()}`,
      creatorId: "admin",
      creatorName: "Official Task",
      type: type as TaskType,
      title: String(title),
      rewardAmount: Number(rewardAmount),
      rewardType: rewardType || 'coins',
      channelLink: String(channelLink),
      userLimit: Number(userLimit),
      completedCount: 0,
      status: "active",
      isFeatured: !!isFeatured,
      createdAt: new Date().toISOString(),
      viewRequirementSeconds: viewRequirementSeconds ? Number(viewRequirementSeconds) : undefined
    };

    state.tasks.push(sysTask);

    // Broadcast new bonus alert alert!
    Object.keys(state.users).forEach(uid => {
      state.notifications.push({
        id: `n_newtask_${uid}_${Date.now()}`,
        userId: uid,
        title: "New Featured Task available! 🌟",
        message: `Earn rewards now by completing: "${title}". Go to Tasks tab before limits end.`,
        type: "bonus_alert",
        read: false,
        createdAt: new Date().toISOString()
      });
    });

    saveState();
    res.json({ success: true, task: sysTask });
  });


  // Security - Simulation of device protection & anti-spam checks
  app.post("/api/security/check-vpn", (req, res) => {
    const vpnDetect = Math.random() < 0.05; // 5% simulated VPN detection logic
    res.json({ vpnDetected: vpnDetect, safeDevice: true });
  });

  // ---- HELPER RANK COMPILER ----
  function updateUserRankAndLevel(u: User) {
    // 1000 exp = 1 level
    const calculatedLevel = Math.max(1, Math.floor(u.exp / 1000) + 1);
    if (calculatedLevel !== u.level) {
      u.level = calculatedLevel;
      // Add level-up notification
      state.notifications.push({
        id: `n_lvl_${u.id}_${Date.now()}`,
        userId: u.id,
        title: "Level Up! 🌟",
        message: `Congratulations! You reached Level ${calculatedLevel}! Dynamic multipliers are now boosted!`,
        type: "bonus_alert",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    // Rank compiler
    let targetRank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'King' = "Bronze";
    if (u.coinBalance >= 50000 || u.mainBalance >= 2000) {
      targetRank = "King";
    } else if (u.coinBalance >= 20000 || u.mainBalance >= 800) {
      targetRank = "Platinum";
    } else if (u.coinBalance >= 8000 || u.mainBalance >= 300) {
      targetRank = "Gold";
    } else if (u.coinBalance >= 2000 || u.mainBalance >= 100) {
      targetRank = "Silver";
    }

    if (u.rank !== targetRank) {
      u.rank = targetRank;
      state.notifications.push({
        id: `n_rank_${u.id}_${Date.now()}`,
        userId: u.id,
        title: `Promoted to ${targetRank}! 👑`,
        message: `Your account level stats match the prestige requirements for ${targetRank}. Premium profile unlocked.`,
        type: "general",
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
