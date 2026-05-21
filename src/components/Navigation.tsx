import React from 'react';
import { useSim } from './SimContext';
import { 
  Home, 
  CheckSquare, 
  Users, 
  Wallet, 
  User as UserIcon, 
  Sliders 
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, user } = useSim();

  const isSuperAdmin = user?.id === 'user_admin';

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'taskUpload', label: 'Promote', icon: Sliders },
    { id: 'refer', label: 'Refer', icon: Users },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  // If super admin, add admin tab directly
  const displayItems = isSuperAdmin 
    ? [...navItems, { id: 'admin', label: 'Admin', icon: Sliders }]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 py-2.5 z-40 px-3 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {displayItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          // Unique color highlights
          const highlightColor = item.id === 'admin' 
            ? 'text-amber-400' 
            : 'text-[#2481cc]';

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 transition-all ${
                isActive 
                  ? `${highlightColor} scale-110 font-bold` 
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-wide font-medium">
                {item.id === 'taskUpload' ? 'Promote' : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
