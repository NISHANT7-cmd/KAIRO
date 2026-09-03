import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X, Users, Sparkles, Shield } from 'lucide-react';
import { DirectMessageConversation, DirectMessage, User } from '../../types';
import { api } from '../../services/api';

interface CommunityDirectMessagesProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onRequireAuth?: () => void;
}

export const CommunityDirectMessages: React.FC<CommunityDirectMessagesProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRequireAuth
}) => {
  const [conversations, setConversations] = useState<DirectMessageConversation[]>([]);
  const [activeConv, setActiveConv] = useState<DirectMessageConversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadConversations();
    }
  }, [isOpen, currentUser]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await api.getConversations();
      const list = res.conversations || [];
      setConversations(list);
      if (list.length > 0 && !activeConv) {
        selectConversation(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: DirectMessageConversation) => {
    setActiveConv(conv);
    try {
      const res = await api.getDirectMessages(conv.id);
      setMessages(res.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    if (!activeConv || !inputText.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.sendDirectMessage(activeConv.id, {
        content: inputText.trim()
      });
      setMessages(prev => [...prev, res.message]);
      setInputText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl h-[600px] border border-pink-100 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-pink-50 via-white to-pink-50 border-b border-pink-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#9e3b5f]" />
            <h3 className="font-display font-black text-base text-[#26152b]">
              Reader & Author Direct Messages
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-pink-100 text-gray-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body grid: sidebar + message view */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          {/* Conversation List */}
          <div className="col-span-4 border-r border-pink-100 overflow-y-auto p-2 space-y-1 bg-pink-50/20">
            {conversations.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#877276] p-4">
                No conversations yet. Connect with fellow readers or discuss theories directly!
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = activeConv?.id === conv.id;
                const other = conv.participantUser;

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-[#9e3b5f] text-white shadow-2xs' 
                        : 'hover:bg-pink-100/50 text-[#26152b]'
                    }`}
                  >
                    <img
                      src={other?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                      alt={other?.displayName || 'User'}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs truncate">{other?.displayName || other?.username || 'User'}</h4>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-pink-100' : 'text-[#877276]'}`}>
                        {conv.lastMessage || 'Say hello...'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Chat Stream */}
          <div className="col-span-8 flex flex-col h-full bg-white">
            {activeConv ? (
              <>
                <div className="p-3 border-b border-pink-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#26152b]">
                    Chat with {activeConv.participantUser?.displayName || 'User'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active on KAIRO
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(m => {
                    const isMine = currentUser?.id === m.senderId;

                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isMine
                              ? 'bg-[#9e3b5f] text-white rounded-br-xs'
                              : 'bg-pink-50/70 border border-pink-100 text-[#26152b] rounded-bl-xs'
                          }`}
                        >
                          <p>{m.content}</p>
                          <span className={`text-[9px] block mt-1 text-right ${isMine ? 'text-pink-200' : 'text-[#877276]'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-pink-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 h-10 px-3.5 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="h-10 px-4 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold flex items-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[#877276]">
                Select a conversation to begin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
