/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { SimProvider, useSim } from './components/SimContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeTab } from './components/HomeTab';
import { TasksTab } from './components/TasksTab';
import { TaskUploadTab } from './components/TaskUploadTab';
import { ReferTab } from './components/ReferTab';
import { WalletTab } from './components/WalletTab';
import { ProfileTab } from './components/ProfileTab';
import { AdminPanel } from './components/AdminPanel';
import { AlertTriangle, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    activeNotifications, 
    dismissNotification, 
    demoLogin, 
    triggerNotification 
  } = useSim();

  // Handle URL referral query codes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      triggerNotification(
        'Referral Detected! 👥', 
        `Triggering automatic sign-up bonuses using link code: ${refCode}. Register your mock account to clear!`,
        'success'
      );
      
      // Auto-populate simulation registration with referral linked
      const btn = document.getElementById('simulation-control-btn');
      if (btn) btn.click();
    }
  }, []);

  // Simple active view switcher
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'tasks':
        return <TasksTab />;
      case 'taskUpload':
        return <TaskUploadTab />;
      case 'refer':
        return <ReferTab />;
      case 'wallet':
        return <WalletTab />;
      case 'profile':
        return <ProfileTab />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans flex flex-col max-w-md mx-auto shadow-2xl relative border-r border-l border-slate-900 overflow-x-hidden">
      
      {/* 1. Header Bar */}
      <Header />

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 px-4 py-4 pb-28 overflow-y-auto">
        {renderActiveTab()}
      </main>

      {/* 3. Bottom Tabs Navigation */}
      <Navigation />

      {/* 4. REAL-TIME FLOATING TOASTS NOTIFICATIONS DISPATCHER */}
      <div className="fixed top-18 right-4 left-4 max-w-[380px] mx-auto z-50 flex flex-col space-y-2 pointer-events-none">
        {activeNotifications.map((noti) => {
          
          const alertColor = 
            noti.type === 'success' ? 'bg-slate-900 border-emerald-500/40 text-emerald-400' :
            noti.type === 'error' ? 'bg-slate-900 border-rose-500/40 text-rose-400' :
            noti.type === 'warning' ? 'bg-slate-900 border-amber-500/40 text-amber-400' :
            'bg-slate-900 border-slate-800 text-[#2481cc]';

          return (
            <div 
              key={noti.id} 
              className={`p-3 rounded-lg border-l-4 shadow-xl select-none flex items-start justify-between pointer-events-auto animate-in slide-in-from-top-4 duration-200 ${alertColor}`}
            >
              <div className="flex flex-col text-left pr-2">
                <span className="text-xs font-black uppercase tracking-wider">{noti.title}</span>
                <span className="text-[11px] text-slate-350 leading-relaxed mt-0.5">{noti.message}</span>
              </div>

              <button 
                id={`dismiss-alert-${noti.id}`}
                onClick={() => dismissNotification(noti.id)} 
                className="text-slate-550 hover:text-white shrink-0 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default function App() {
  return (
    <SimProvider>
      <div className="bg-slate-950 min-h-screen flex justify-center items-center">
        <AppContent />
      </div>
    </SimProvider>
  );
}
