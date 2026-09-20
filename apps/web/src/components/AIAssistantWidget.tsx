import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Building,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolUsed?: string;
  data?: any;
  suggestions?: string[];
  feedbackSent?: boolean;
}

export const AIAssistantWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Betoch AI Assistant. I can help you find verified rental homes in Addis Ababa, explain Ethiopian rental regulations (Proclamation 1320/2024), or check your applications.',
      suggestions: [
        'Find 2-bedroom in Bole under 35k',
        'What is the maximum security deposit by law?',
        'How does Fayda verification work?',
        'Check my rental applications'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.chatWithAssistant(text, history);

      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.reply,
        toolUsed: res.toolUsed,
        data: res.data,
        suggestions: res.suggestions
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your request. Please try again or rephrase your question.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (msgId: string, rating: 'POSITIVE' | 'NEGATIVE') => {
    try {
      await api.submitAiFeedback('AI_SUPPORT_ASSISTANT', rating, msgId);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedbackSent: true } : m))
      );
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I am your Betoch AI Assistant. How can I help you today?',
        suggestions: [
          'Find 2-bedroom in Bole under 35k',
          'What is the maximum security deposit by law?',
          'Check my rental applications'
        ]
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-brand-700 hover:bg-brand-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105 border border-brand-500/30"
          aria-label="Open Betoch AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-gold-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-bold tracking-wide">Betoch AI Assistant</span>
          <Sparkles className="w-3.5 h-3.5 text-gold-300 opacity-80" />
        </button>
      )}

      {/* Slide-over Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gold-400/20 flex items-center justify-center border border-gold-400/40">
                <Bot className="w-4 h-4 text-gold-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-wide">Betoch Rental Assistant</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-medium border border-emerald-500/30">
                    Live AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">Tool-based marketplace intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 custom-scrollbar text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-700 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs">{m.content}</p>

                  {/* Render Embedded Tool Result Cards if any */}
                  {m.toolUsed === 'searchProperties' && Array.isArray(m.data) && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                      {m.data.map((prop: any) => (
                        <Link
                          key={prop.id}
                          to={`/properties/${prop.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-brand-50 border border-slate-200/80 transition group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-900 truncate group-hover:text-brand-700 text-[11px]">
                              {prop.title}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {prop.location?.subCity} • {prop.bedrooms} bed • {Number(prop.pricing?.monthlyRent).toLocaleString()} ETB/mo
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Tool Citation Badge */}
                  {m.toolUsed && (
                    <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Verified source: {m.toolUsed}</span>
                      {!m.feedbackSent ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleFeedback(m.id, 'POSITIVE')}
                            className="p-1 hover:text-emerald-600 transition"
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(m.id, 'NEGATIVE')}
                            className="p-1 hover:text-red-600 transition"
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-0.5 text-[9px]">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Feedback saved
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Suggestion Chips */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                    {m.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-brand-50 border border-brand-200 text-brand-800 text-[10px] font-medium transition hover:border-brand-400 shadow-2xs text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2 bg-white rounded-xl border border-slate-100 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                <span>Consulting Betoch intelligence layer...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything (e.g. 2-bed in Bole under 30k)..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-xl transition shadow-xs"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
