import React, { useState, useEffect } from 'react';
import { useSim } from './SimContext';
import { Transaction, WithdrawMethod } from '../types';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CreditCard,
  Send,
  PlusCircle,
  Gem,
  Coins,
  History,
  Info,
  CheckCircle2,
  Lock,
  Wallet
} from 'lucide-react';

export const WalletTab: React.FC = () => {
  const { 
    currentUserId, 
    user, 
    refreshUserData, 
    triggerNotification 
  } = useSim();

  // Transactions logs state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState<boolean>(false);

  // Withdraw flow parameters
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>('bkash');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawInfo, setWithdrawInfo] = useState<string>('');
  const [withdrawing, setWithdrawing] = useState<boolean>(false);

  // Deposit flow parameters
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [depositMethod, setDepositMethod] = useState<WithdrawMethod>('bkash');
  const [depositAmount, setDepositAmount] = useState<string>('200');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [txidInput, setTxidInput] = useState<string>('');
  const [depositing, setDepositing] = useState<boolean>(false);

  const fetchTransactions = async () => {
    setLoadingTxs(true);
    try {
      const res = await fetch('/api/wallet/transactions', {
        headers: { 'x-user-id': currentUserId }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTxs(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentUserId]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawInfo.trim()) {
      triggerNotification('Missing Fields', 'Please enter withdrawal amount and receiving address / phone.', 'warning');
      return;
    }

    const amt = Number(withdrawAmount);
    if (isNaN(amt) || amt < 100) {
      triggerNotification('Validation Failed', 'Minimum payout limit is 100 BDT.', 'warning');
      return;
    }

    if (user && user.mainBalance < amt) {
      triggerNotification('Insufficient Funds', 'You do not have enough cash in your Main Wallet.', 'error');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({
          amount: amt,
          method: withdrawMethod,
          info: withdrawInfo.trim()
        })
      });

      if (res.ok) {
        triggerNotification('Withdrawal Placed! ⌛', `Queued ${amt} BDT via ${withdrawMethod}. Manual approval queued.`, 'success');
        setWithdrawAmount('');
        setWithdrawInfo('');
        
        refreshUserData();
        fetchTransactions();
      } else {
        const err = await res.json();
        triggerNotification('Payout Error', err.error || 'Payout request failed.', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderNumber.trim() || !txidInput.trim()) {
      triggerNotification('Missing Credentials', 'Please enter sender phone number and TXID code.', 'warning');
      return;
    }

    const depAmt = Number(depositAmount);
    if (isNaN(depAmt) || depAmt < 50) {
      triggerNotification('Limits Warning', 'Minimum deposit is 50 BDT.', 'warning');
      return;
    }

    setDepositing(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({
          amount: depAmt,
          method: depositMethod,
          senderNumber: senderNumber.trim(),
          txid: txidInput.toUpperCase().trim()
        })
      });

      if (res.ok) {
        triggerNotification('Deposit Cleared! 💎', `${depAmt} BDT added to Campaign Deposit. You can now launch custom tasks!`, 'success');
        setShowDepositModal(false);
        setSenderNumber('');
        setTxidInput('');
        
        refreshUserData();
        fetchTransactions();
      } else {
        const err = await res.json();
        triggerNotification('Deposit Failed', err.error || 'Verification error.', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto animate-in fade-in duration-200">
      
      {/* WALLET BALANCES STATS BOARD */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-black leading-relaxed">
              Total Assets Value
            </span>
            <span id="cash-balance-subdisplay" className="text-2xl font-black text-white font-mono flex items-baseline mt-0.5">
              {((user?.mainBalance || 0) + (user?.depositBalance || 0)).toFixed(2)}
              <span className="text-xs font-bold text-slate-400 ml-1">BDT</span>
            </span>
          </div>

          <button 
            id="deposit-open-btn"
            onClick={() => { setShowDepositModal(true); setTxidInput(''); }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 px-3 rounded-lg text-xs flex items-center transition-colors shadow"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            LOAD FUNDS
          </button>
        </div>

        {/* Breakdown bar */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3.5">
          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-850">
            <span className="text-[9px] text-slate-500 font-bold uppercase block leading-relaxed">Withdrawable Cash</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {user?.mainBalance?.toFixed(2)} BDT
            </span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-850">
            <span className="text-[9px] text-slate-500 font-bold uppercase block leading-relaxed">Deposit Campaigns</span>
            <span className="text-sm font-bold text-indigo-400 font-mono mt-0.5 block">
              {user?.depositBalance?.toFixed(2)} BDT
            </span>
          </div>
        </div>

      </div>


      {/* WITHDRAW PLACEMENT FORM */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center">
          <ArrowUpRight className="w-4 h-4 mr-1.5 text-rose-400" />
          Request Secure Withdrawal
        </h3>

        <form onSubmit={handleWithdrawSubmit} className="space-y-3">
          
          <div className="grid grid-cols-2 gap-3">
            {/* Method Select */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Method</label>
              <select 
                id="withdraw-gateway"
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value as WithdrawMethod)}
                className="w-full bg-slate-950 text-white text-xs px-2.5 py-2 rounded-lg border border-slate-805/80 focus:outline-none focus:border-[#2481cc]"
              >
                <option value="bkash">bKash (BD) ৳</option>
                <option value="nagad">Nagad (BD) ৳</option>
                <option value="rocket">Rocket (BD) ৳</option>
                <option value="binance">Binance Pay (ID)</option>
                <option value="usdt">USDT Wallet (TRC-20)</option>
              </select>
            </div>

            {/* Amount input */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Amount (Min 100)</label>
              <input 
                id="withdraw-amt-input"
                type="number"
                min="100"
                required
                placeholder="Amount in BDT"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
              {['bkash', 'nagad', 'rocket'].includes(withdrawMethod) 
                ? 'Mobile Personal Wallet Number' 
                : 'Wallet Address / Pay ID'
              }
            </label>
            <input 
              id="withdraw-target-info"
              type="text"
              required
              placeholder={['bkash', 'nagad', 'rocket'].includes(withdrawMethod) ? 'e.g. 017XXXXXXXX' : 'e.g. Binance Pay ID / crypto address'}
              value={withdrawInfo}
              onChange={(e) => setWithdrawInfo(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc] font-mono text-[11px]"
            />
          </div>

          <div className="bg-slate-950 p-2 text-[9px] text-slate-500 rounded leading-relaxed border border-slate-850 flex items-center">
            <Info className="w-4 h-4 mr-1 text-[#2481cc] shrink-0" />
            Payout orders are checked by the admin. Real approvals run under 2 hours limit safely.
          </div>

          <button 
            id="withdraw-submit-btn"
            type="submit"
            disabled={withdrawing}
            className="w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white font-black py-2 rounded-lg text-xs flex items-center justify-center tracking-wider uppercase shadow"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {withdrawing ? "Validating security..." : "Submit Withdrawal Order"}
          </button>

        </form>

      </div>


      {/* TRANSACTIONS LEDGER LIST */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        
        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2.5 flex items-center">
          <History className="w-4 h-4 mr-1.5 text-slate-400" />
          Transactions Statement History
        </h3>

        {loadingTxs ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Loading ledger...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-6 text-center text-[10px] text-slate-500 bg-slate-950 rounded border border-slate-850">
            No transaction statements recorded. Start claiming tasks or claim daily rewards!
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {transactions.map((t) => {
              const isEarn = ['earn', 'daily_bonus', 'mining', 'spin', 'refund', 'scratch'].includes(t.type);
              const isDep = t.type === 'deposit';

              return (
                <div key={t.id} className="bg-slate-950 p-2.5 rounded border border-slate-850/80 flex items-center justify-between">
                  
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className={`p-1 rounded-lg ${isEarn ? 'bg-emerald-500/10 text-emerald-400' : isDep ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-500'}`}>
                      {isEarn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </span>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate max-w-[200px]">
                        {t.description}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono capitalize">
                        {t.type.replace('_', ' ')} • {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Price tags details */}
                  <div className="text-right font-mono flex items-center space-x-1 whitespace-nowrap">
                    <span className={`text-xs font-black ${isEarn || isDep ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {isEarn || isDep ? '+' : '-'}{t.amount}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans">
                      {t.balanceType === 'coins' ? 'Coins' : 'BDT'}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>


      {/* --- SIMULATED DEPOSIT MOCKUP PANEL SCREEN --- */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <form 
            id="deposit-proof-form"
            onSubmit={handleDepositSubmit} 
            className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-sm p-4 relative text-left shadow-2xl animate-in zoom-in-100 duration-150"
          >
            
            <button 
              id="close-deposit-modal"
              type="button"
              onClick={() => setShowDepositModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center">
              <PlusCircle className="w-4 h-4 mr-1.5 text-emerald-400" />
              Campaign Wallet Load Simulation
            </h3>

            {/* Steps guidelines */}
            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg mb-4 text-[10.5px] leading-relaxed text-slate-400 space-y-1">
              <span className="text-white font-bold block mb-1">Instructions (Manual Deposit Simulation):</span>
              <p>1. Send money to Personal Wallet: <strong className="text-amber-400">01700-000000</strong></p>
              <p>2. Load Gateway: Choose method (bKash/Nagad/Crypto)</p>
              <p>3. Submit the Transaction TXID code to credit deposit instantly.</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">Method</label>
                  <select 
                    id="dep-method"
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value as any)}
                    className="w-full bg-slate-950 text-white text-xs px-2.5 py-2 rounded-lg border border-slate-805/80 focus:outline-none"
                  >
                    <option value="bkash">bKash (BD) ৳</option>
                    <option value="nagad">Nagad (BD) ৳</option>
                    <option value="rocket">Rocket (BD) ৳</option>
                    <option value="binance">Binance Cash</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">Amount (BDT)</label>
                  <select 
                    id="dep-amt"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-2.5 py-2 rounded-lg border border-slate-805/80 focus:outline-none"
                  >
                    <option value="50">50 BDT</option>
                    <option value="100">100 BDT</option>
                    <option value="200">200 BDT</option>
                    <option value="500">500 BDT</option>
                    <option value="1000">1,000 BDT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Your Sender Mobile / Pay ID</label>
                <input 
                  id="dep-sender"
                  type="text"
                  required
                  placeholder="e.g. 017XXXXXXXX"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc] font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Transaction TXID (Min 8 code length)</label>
                <input 
                  id="dep-txid"
                  type="text"
                  required
                  placeholder="e.g. BK89HJS7S or NAG98273"
                  value={txidInput}
                  onChange={(e) => setTxidInput(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-[#2481cc] font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="mt-5 flex space-x-2.5">
              <button 
                id="cancel-dep-btn"
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="w-1/2 bg-slate-800 text-slate-400 py-2 rounded-lg text-xs"
              >
                Close
              </button>
              <button 
                id="sumbit-dep-btn"
                type="submit"
                disabled={depositing}
                className="w-1/2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black py-2 rounded-lg text-xs"
              >
                {depositing ? "Verifying ledger..." : "Verify & Load funds"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
