// ==============================================================================
// BETOCH NOTIFICATION CENTER POPOVER
// ==============================================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Calendar,
  FileText,
  DollarSign,
  Info,
  ExternalLink,
  X
} from 'lucide-react';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose
}) => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: () => api.getNotifications({ limit: 30 }),
    enabled: isOpen,
    refetchInterval: 15000 // Poll every 15 seconds when popover is viewed
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
    }
  });

  if (!isOpen) return null;

  const notifications = data?.notifications || [];
  const filtered = filterType === 'ALL'
    ? notifications
    : notifications.filter((n: any) => n.type === filterType);

  const getIcon = (type: string) => {
    switch (type) {
      case 'VIEWING':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'APPLICATION':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'PRICE_DROP':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-brand-600" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-700" />
          <h3 className="text-xs font-bold text-slate-900">Notification Center</h3>
          {Boolean(data?.unreadCount && data.unreadCount > 0) && (
            <span className="px-1.5 py-0.5 rounded-full bg-brand-700 text-white text-[10px] font-bold">
              {data?.unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {Boolean(data?.unreadCount && data.unreadCount > 0) && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] font-semibold">
        {['ALL', 'VIEWING', 'APPLICATION', 'PRICE_DROP'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              filterType === t
                ? 'bg-brand-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t === 'ALL' ? 'All' : t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
            No notifications in this category.
          </div>
        ) : (
          filtered.map((n: any) => (
            <div
              key={n.id}
              className={`p-3.5 text-xs transition-colors hover:bg-slate-50 flex items-start gap-3 ${
                !n.isRead ? 'bg-brand-50/40' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs mt-0.5">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs truncate ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                <div className="mt-2 flex items-center justify-between">
                  {n.linkUrl ? (
                    <Link
                      to={n.linkUrl}
                      onClick={() => {
                        if (!n.isRead) markReadMutation.mutate(n.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline"
                    >
                      View Details <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : <span />}
                  {!n.isRead && (
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      className="text-[10px] text-slate-500 hover:text-slate-800"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
