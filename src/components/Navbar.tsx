import React, { useState } from 'react';
import { 
  Sparkles, Search, Bell, BookOpen, Flame, Feather, 
  User as UserIcon, LogOut, Compass, Globe, Users, 
  Tv, Library, ChevronDown, CheckCircle2, Shield 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  onOpenSearch: () => void;
  onOpenNotifs: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  onOpenNotifs,
  onOpenAuth
}) => {
  const { user, logout, unreadNotifsCount } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'universes', label: 'Universes', icon: Globe },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'anime', label: 'Anime Hub', icon: Tv },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-pink-100/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button 
            id="kairo-logo-btn"
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9e3b5f] to-[#f47fa5] flex items-center justify-center text-white shadow-md shadow-pink-900/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-xl tracking-tight font-display text-[#26152b] group-hover:text-[#9e3b5f] transition-colors">
                KAIRO
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#877276] -mt-1">
                Fandom & Stories
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {navLinks.map(link => {
              const active = currentView === link.id;
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    active 
                      ? 'bg-[#fee7ff] text-[#9e3b5f] font-semibold shadow-xs' 
                      : 'text-[#544246] hover:text-[#26152b] hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#9e3b5f]' : 'text-[#877276]'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search Bar Input / Trigger */}
        <div className="flex-1 max-w-md hidden sm:block">
          <button
            id="global-search-trigger"
            onClick={onOpenSearch}
            className="w-full h-10 px-3.5 rounded-full bg-white/80 hover:bg-white border border-pink-100 hover:border-[#f47fa5]/40 text-left text-xs sm:text-sm text-[#877276] flex items-center justify-between shadow-xs hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[#9e3b5f] group-hover:scale-110 transition-transform" />
              <span>Search stories, lore, universes, anime...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-[#877276] bg-[#fee7ff]/60 border border-pink-200/50 rounded-md">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2.5">
          
          {/* Mobile search icon */}
          <button
            id="mobile-search-btn"
            onClick={onOpenSearch}
            className="sm:hidden p-2 rounded-lg text-[#544246] hover:bg-white/80 cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Reading Streak Indicator */}
          {user && (
            <button
              id="streak-indicator-btn"
              onClick={() => onNavigate('profile', { tab: 'journey' })}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffeffe] border border-pink-200/70 text-[#9e3b5f] text-xs font-bold hover:bg-[#fee7ff] transition-all cursor-pointer"
              title="Daily Reading Streak"
            >
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
              <span>{user.readingStreak ?? 0}d</span>
              <span className="text-[10px] text-[#877276] font-normal pl-1 border-l border-pink-200">
                Lv.{user.level || 1}
              </span>
            </button>
          )}

          {/* Master Admin Portal Button (If user is ADMIN) */}
          {user?.role === 'ADMIN' && (
            <button
              id="admin-portal-nav-btn"
              onClick={() => onNavigate('admin')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 shadow-xs'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin Portal</span>
            </button>
          )}

          {/* Notifications Button */}
          {user && (
            <button
              id="notifs-drawer-btn"
              onClick={onOpenNotifs}
              className="relative p-2 rounded-full text-[#544246] hover:bg-white/80 hover:text-[#9e3b5f] transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#9e3b5f] rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>
          )}

          {/* User Profile Avatar / Login CTA */}
          {user ? (
            <div className="relative">
              <button
                id="user-avatar-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-[#f47fa5] transition-all cursor-pointer focus:outline-none"
              >
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-pink-200 shadow-xs"
                />
              </button>

              {showUserDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-56 glass-card rounded-2xl p-2 shadow-2xl z-50 border border-pink-200/80 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-2.5 border-b border-pink-100 flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-pink-200"
                    />
                    <div className="overflow-hidden">
                      <div className="font-bold text-sm text-[#26152b] truncate">{user.displayName}</div>
                      <div className="text-xs text-[#877276] truncate">@{user.username}</div>
                    </div>
                  </div>

                  <div className="py-1.5 space-y-0.5">
                    <button
                      onClick={() => onNavigate('profile')}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-[#26152b] hover:bg-[#fee7ff] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#9e3b5f]" />
                      <span>My Profile & Badges</span>
                    </button>

                    <button
                      onClick={() => onNavigate('library')}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-[#26152b] hover:bg-[#fee7ff] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Library className="w-4 h-4 text-[#9e3b5f]" />
                      <span>Reading Library</span>
                    </button>

                    {user.role === 'ADMIN' && (
                      <button
                        onClick={() => onNavigate('admin')}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium text-[#635882] hover:bg-purple-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-[#635882]" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <div className="border-t border-pink-100 my-1"></div>

                    <button
                      onClick={logout}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="nav-login-cta"
              onClick={onOpenAuth}
              className="btn-gradient px-4 py-2 rounded-full text-xs font-bold cursor-pointer"
            >
              Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
