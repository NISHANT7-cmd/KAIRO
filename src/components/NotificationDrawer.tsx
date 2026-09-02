import React from 'react';
import { Bell, Check, X, BookOpen, MessageSquare, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateStory: (storySlug: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateStory,
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAuth();

  if (!isOpen) return null;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_chapter': return <BookOpen className="w-4 h-4 text-[#9e3b5f]" />;
      case 'comment_reply': return <MessageSquare className="w-4 h-4 text-[#635882]" />;
      case 'new_follower': return <UserPlus className="w-4 h-4 text-[#466273]" />;
      default: return <Sparkles className="w-4 h-4 text-[#f47fa5]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#26152b]/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md h-full glass-card border-l border-pink-200/90 shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#9e3b5f]" />
            <h3 className="font-bold text-lg text-[#26152b] font-display">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-xs font-semibold text-[#9e3b5f] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#544246] hover:bg-pink-100/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 space-y-3 hide-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-[#877276]">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">All caught up!</p>
              <p className="text-xs mt-1">You will receive notifications for new chapters and replies here.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationRead(notif.id);
                  if (notif.linkUrl.includes('/story/')) {
                    const slug = notif.linkUrl.split('/story/')[1]?.split('/')[0];
                    if (slug) {
                      onNavigateStory(slug);
                      onClose();
                    }
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  notif.isRead 
                    ? 'bg-white/60 border-pink-100/70 hover:bg-white' 
                    : 'bg-[#fee7ff]/80 border-pink-200/90 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-xs">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-[#26152b] truncate">{notif.title}</h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#9e3b5f]" />
                      )}
                    </div>
                    <p className="text-xs text-[#544246] mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-[#877276] mt-1.5 block">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
