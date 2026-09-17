import React from 'react';
import { BookOpen, Compass, Feather, Users, Library, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isReader = user?.role === 'USER';

  const items = [
    { id: 'home', label: t('nav_home', 'Home'), icon: BookOpen },
    { id: 'discover', label: t('nav_discover', 'Discover'), icon: Compass },
    ...(!isReader ? [{ id: 'studio', label: t('nav_studio', 'Write'), icon: Feather, isSpecial: true }] : []),
    { id: 'community', label: t('nav_community', 'Community'), icon: Users },
    { id: 'library', label: t('nav_library', 'Library'), icon: Library },
    { id: 'profile', label: t('nav_profile', 'Profile'), icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-pink-100/80 px-2 py-2 pb-safe shadow-lg">
      <div className="flex items-center justify-around">
        {items.map(item => {
          const active = currentView === item.id || (item.id === 'studio' && (currentView === 'create-story' || currentView === 'editor'));
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => onNavigate(item.id, item.id === 'profile' ? user?.username : undefined)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
                active ? 'text-[#9e3b5f] font-bold' : 'text-[#877276] hover:text-[#26152b]'
              }`}
            >
              <div className={`p-1 rounded-lg ${active ? 'bg-[#fee7ff]' : ''} ${item.isSpecial && !active ? 'text-[#9e3b5f]' : ''}`}>
                <Icon className={`w-5 h-5 ${active ? 'text-[#9e3b5f]' : item.isSpecial ? 'text-[#9e3b5f]' : 'text-[#877276]'}`} />
              </div>
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
