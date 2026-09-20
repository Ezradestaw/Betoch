// ==============================================================================
// BETOCH MESSAGING & INQUIRY CENTER
// Secure, direct communication between tenants and verified homeowners
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Send,
  Building,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const QUICK_QUESTIONS = [
  'Is this property still available?',
  'When is the earliest move-in date?',
  'Can we schedule a physical viewing this weekend?',
  'Are water and backup generator included?',
  'Is the rent slightly negotiable for a 12-month lease?'
];

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('conversationId');

  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConvId);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all user conversations
  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
    refetchInterval: 10000 // Poll every 10s for new messages
  });

  // Select first conversation if none selected
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].conversationId);
    }
  }, [conversations, selectedConvId]);

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConvId],
    queryFn: () => (selectedConvId ? api.getMessages(selectedConvId) : Promise.resolve([])),
    enabled: !!selectedConvId,
    refetchInterval: 5000 // Poll every 5s for active conversation
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: ({ convId, text }: { convId: string; text: string }) =>
      api.sendMessage(convId, text),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConvId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedConvId || sendMutation.isPending) return;
    sendMutation.mutate({ convId: selectedConvId, text: messageText.trim() });
  };

  const handleQuickQuestion = (question: string) => {
    if (!selectedConvId) return;
    sendMutation.mutate({ convId: selectedConvId, text: question });
  };

  const activeConv = conversations.find((c: any) => c.conversationId === selectedConvId);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Communication Center</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Direct Landlord & Tenant Chat</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-End Logged for Dispute Protection</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Anti-Scam Security Notice Banner */}
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3.5 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Safety Guideline: </span>
            Never transfer rental payments, key deposits, or inspection fees directly to private personal bank accounts before viewing the home in person and verifying the Carta title deed on Betoch.
          </div>
        </div>

        {/* Messaging Layout Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex-1 flex overflow-hidden min-h-[600px] h-[72vh]">
          {/* LEFT: Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col ${
              selectedConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Conversations ({conversations.length})
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {convsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No active conversations</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When you inquire about a property or a tenant contacts you, messages appear here.
                  </p>
                </div>
              ) : (
                conversations.map((conv: any) => {
                  const isSelected = conv.conversationId === selectedConvId;
                  return (
                    <button
                      key={conv.conversationId}
                      onClick={() => setSelectedConvId(conv.conversationId)}
                      className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                        isSelected ? 'bg-brand-50/80 border-r-4 border-brand-700' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-900 font-bold flex items-center justify-center shrink-0 text-sm">
                        {conv.otherParticipant?.name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {conv.otherParticipant?.name || 'Verified User'}
                          </h4>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(conv.lastMessageAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                        </div>

                        {conv.propertyTitle && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold truncate mb-1">
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate">{conv.propertyTitle}</span>
                          </div>
                        )}

                        <p className="text-xs text-slate-500 truncate">
                          {conv.lastMessage || 'No messages yet.'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Active Chat View */}
          <div
            className={`flex-1 flex flex-col ${
              !selectedConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConv ? (
              <>
                {/* Chat Top Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConvId(null)}
                      className="md:hidden p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-xs">
                      {activeConv.otherParticipant?.name?.[0] || 'U'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {activeConv.otherParticipant?.name}
                        </h3>
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Addis Ababa, Ethiopia</p>
                    </div>
                  </div>

                  {activeConv.propertyId && (
                    <Link
                      to={`/properties/${activeConv.propertyId}`}
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                      View Listing Details
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Property Context Snippet Bar */}
                {activeConv.propertyTitle && (
                  <div className="px-4 py-2 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-950">
                    <div className="flex items-center gap-2 truncate">
                      <Building className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="font-semibold truncate">Listing inquiry: {activeConv.propertyTitle}</span>
                    </div>
                    <Link
                      to={`/properties`}
                      className="text-[11px] text-emerald-800 font-bold hover:underline shrink-0 ml-2"
                    >
                      Browse More
                    </Link>
                  </div>
                )}

                {/* Message Bubbles Thread */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
                  {messagesLoading ? (
                    <div className="p-8 text-center text-xs text-slate-400">Loading conversation history...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-8 h-8 text-brand-600 mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-bold text-slate-700">Start the conversation</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                        Ask about lease terms, amenities, or tap any quick-inquiry question below.
                      </p>
                    </div>
                  ) : (
                    messages.map((m: any) => {
                      const isMe = m.senderId === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs shadow-xs ${
                              isMe
                                ? 'bg-brand-700 text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 1-Tap Quick Question Chips */}
                <div className="px-4 py-2 border-t border-slate-100 bg-white overflow-x-auto custom-scrollbar flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Quick Ask:
                  </span>
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickQuestion(q)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-900 border border-slate-200 text-[11px] font-medium text-slate-600 transition-colors shrink-0 whitespace-nowrap"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message to landlord..."
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sendMutation.isPending}
                    className="px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No Conversation Selected</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Select a chat thread from the left or inquire on any home listing to start a verified conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
