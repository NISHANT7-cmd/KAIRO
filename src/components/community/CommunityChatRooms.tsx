import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, Users, MessageSquare, Send, Smile, Pin, Lock, 
  AlertTriangle, ShieldAlert, Sparkles, BookOpen, Clock, Flame 
} from 'lucide-react';
import { ChatRoom, ChatMessage, User } from '../../types';
import { api } from '../../services/api';

interface CommunityChatRoomsProps {
  user: User | null;
  onOpenStory?: (slug: string) => void;
  onRequireAuth?: () => void;
  selectedRoomSlug?: string;
}

export const CommunityChatRooms: React.FC<CommunityChatRoomsProps> = ({
  user,
  onOpenStory,
  onRequireAuth,
  selectedRoomSlug
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [sending, setSending] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await api.getChatRooms();
      const list = res.rooms || [];
      setRooms(list);
      
      const target = selectedRoomSlug 
        ? list.find(r => r.slug === selectedRoomSlug) 
        : list[0];
      if (target) {
        selectRoom(target);
      }
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const selectRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setLoadingMessages(true);
    try {
      const res = await api.getChatMessages(room.id);
      setMessages(res.messages || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load room messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth?.();
      return;
    }
    if (!activeRoom || !inputText.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.sendChatMessage(activeRoom.id, {
        content: inputText.trim(),
        isSpoiler
      });
      setMessages(prev => [...prev, res.message]);
      setInputText('');
      setIsSpoiler(false);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    if (!activeRoom) return;
    try {
      const res = await api.reactChatMessage(activeRoom.id, messageId, emoji);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: res.reactions } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRevealSpoiler = (id: string) => {
    setRevealedSpoilers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] max-h-[85vh]">
      {/* Rooms Sidebar */}
      <div className="lg:col-span-4 glass-card rounded-3xl p-4 border border-pink-100 flex flex-col h-full overflow-hidden shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h2 className="font-display font-bold text-sm text-[#26152b]">Live Channels</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-[#9e3b5f]">
            {rooms.length} Active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
          {loadingRooms ? (
            <div className="text-center py-12 text-xs text-[#877276]">Loading discussion rooms...</div>
          ) : (
            rooms.map(room => {
              const active = activeRoom?.id === room.id;
              return (
                <div
                  key={room.id}
                  id={`room-item-${room.slug}`}
                  onClick={() => selectRoom(room)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    active 
                      ? 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-[#9e3b5f] shadow-xs' 
                      : 'bg-white/70 border-pink-100/80 hover:bg-white hover:border-pink-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-xl shrink-0">
                    {room.icon || '💬'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-xs text-[#26152b] truncate">{room.name}</h3>
                      {room.isSpoiler && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-bold shrink-0">
                          SPOILERS
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#877276] truncate mt-0.5">{room.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-semibold mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{room.onlineCount} online</span>
                      <span className="text-[#877276]">•</span>
                      <span className="text-[#877276]">{room.totalMembers} members</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-8 glass-card rounded-3xl border border-pink-100 flex flex-col h-full overflow-hidden shadow-sm">
        {/* Room Header */}
        {activeRoom ? (
          <div className="p-4 bg-white/80 border-b border-pink-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">{activeRoom.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-base text-[#26152b] truncate">{activeRoom.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-pink-50 text-[#9e3b5f] text-[10px] font-bold uppercase tracking-wider">
                    {activeRoom.category}
                  </span>
                </div>
                <p className="text-xs text-[#877276] truncate">{activeRoom.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{activeRoom.onlineCount} chatting</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-pink-100 text-xs text-[#877276]">Select a channel to join</div>
        )}

        {/* Pinned Message Banner */}
        {activeRoom?.pinnedMessage && (
          <div className="px-4 py-2 bg-amber-50/90 border-b border-amber-200/60 flex items-center gap-2 text-xs text-amber-900">
            <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-bold">Pinned:</span>
            <span className="truncate">{activeRoom.pinnedMessage}</span>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full text-xs text-[#877276]">
              Loading room stream...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#877276] space-y-2">
              <MessageSquare className="w-8 h-8 text-pink-300" />
              <p className="text-sm font-bold text-[#26152b]">Quiet in this room...</p>
              <p className="text-xs">Be the first to share your thoughts, theories, or questions!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = user?.id === msg.userId;
              const isSpoilerMessage = msg.isSpoiler;
              const isRevealed = revealedSpoilers[msg.id];

              return (
                <div key={msg.id} className="flex items-start gap-3 group">
                  <img
                    src={msg.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={msg.displayName || msg.username}
                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-pink-100 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#26152b]">{msg.displayName || msg.username}</span>
                      {msg.isAuthor && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[9px] font-black tracking-wide">
                          AUTHOR
                        </span>
                      )}
                      {msg.isMod && (
                        <span className="px-1.5 py-0.2 rounded bg-pink-100 text-pink-700 text-[9px] font-black tracking-wide">
                          MOD
                        </span>
                      )}
                      <span className="text-[10px] text-[#877276] ml-auto">
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content (Handling Spoilers) */}
                    {isSpoilerMessage && !isRevealed ? (
                      <div 
                        onClick={() => toggleRevealSpoiler(msg.id)}
                        className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span className="font-semibold">Spoiler Warning — Click to reveal</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#3a2830] leading-relaxed break-words bg-white/60 p-2.5 rounded-xl border border-pink-100/60 shadow-2xs">
                        {msg.content}
                        {isSpoilerMessage && (
                          <span 
                            onClick={() => toggleRevealSpoiler(msg.id)}
                            className="block text-[10px] text-amber-700 font-bold mt-1 cursor-pointer hover:underline"
                          >
                            Hide spoiler
                          </span>
                        )}
                      </div>
                    )}

                    {/* Story Card Attachment if attached */}
                    {msg.storyCard && (
                      <div 
                        onClick={() => onOpenStory && onOpenStory(msg.storyCard!.slug)}
                        className="p-2 rounded-xl bg-pink-50/70 border border-pink-200/80 flex items-center gap-3 cursor-pointer hover:bg-pink-100/80 transition-all max-w-sm"
                      >
                        <img src={msg.storyCard.cover} alt={msg.storyCard.title} className="w-10 h-14 object-cover rounded-lg shadow-2xs" />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#9e3b5f] uppercase tracking-wider flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Story Mention
                          </span>
                          <h4 className="font-bold text-xs text-[#26152b] truncate">{msg.storyCard.title}</h4>
                          <p className="text-[10px] text-[#877276]">By {msg.storyCard.author}</p>
                        </div>
                      </div>
                    )}

                    {/* Emoji Reactions */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {['❤️', '🔥', '🤯', '✨'].map(emoji => {
                        const count = msg.reactions?.[emoji] || 0;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReact(msg.id, emoji)}
                            className={`px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 border transition-all cursor-pointer ${
                              count > 0 
                                ? 'bg-pink-50 border-pink-200 text-[#9e3b5f] font-bold' 
                                : 'bg-transparent border-transparent hover:bg-pink-50 text-gray-500 opacity-60 group-hover:opacity-100'
                            }`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="text-[10px]">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-pink-100">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setIsSpoiler(!isSpoiler)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                isSpoiler 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : 'bg-gray-50 text-[#877276] border-gray-200 hover:bg-gray-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Mark as Spoiler</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={user ? `Message #${activeRoom?.name || 'chat'}...` : 'Sign in to participate in the conversation'}
              disabled={!user || sending}
              className="flex-1 h-11 px-4 rounded-xl bg-pink-50/40 border border-pink-200 focus:bg-white focus:border-[#9e3b5f] outline-none text-xs font-medium text-[#26152b] transition-all"
            />
            <button
              type="submit"
              disabled={!user || !inputText.trim() || sending}
              className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#f47fa5] to-[#9e3b5f] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
