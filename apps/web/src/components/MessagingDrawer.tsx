import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { X, Send, MessageSquare, Home } from 'lucide-react';

interface MessagingDrawerProps {
  recipientId?: string;
  recipientName?: string;
  propertyId?: string;
  propertyTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MessagingDrawer: React.FC<MessagingDrawerProps> = ({
  recipientId,
  recipientName,
  propertyId,
  propertyTitle,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && recipientId) {
      loadOrCreateConversation();
    }
  }, [isOpen, recipientId]);

  const loadOrCreateConversation = async () => {
    setLoading(true);
    try {
      const convs = await api.getConversations();
      const existing = convs.find((c: any) => c.otherParticipant.id === recipientId);

      if (existing) {
        setConversationId(existing.conversationId);
        const msgs = await api.getMessages(existing.conversationId);
        setMessages(msgs);
      } else {
        // Will create on first message
        setConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load conversation', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');

    try {
      if (conversationId) {
        const newMsg = await api.sendMessage(conversationId, content);
        setMessages((prev) => [...prev, { ...newMsg, isMe: true, senderName: user?.profile.firstName }]);
      } else if (recipientId) {
        const res = await api.startConversation({
          recipientId,
          propertyId,
          initialMessage: content
        });
        setConversationId(res.conversationId);
        const msgs = await api.getMessages(res.conversationId);
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm">
              {recipientName?.[0] || 'O'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{recipientName || 'Message'}</h4>
              {propertyTitle && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1">
                  <Home className="w-3 h-3 text-slate-400 shrink-0" />
                  {propertyTitle}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-slate-50/50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">Start the conversation</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Ask about availability, lease terms, or request an in-person viewing.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    m.isMe
                      ? 'bg-brand-700 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Send Input Box */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white disabled:opacity-40 transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
