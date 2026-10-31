import React from 'react';
import { Bell, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '../utils/formatters';

export default function NotificationPanel({ notifications = [], onMarkRead, maxItems = 5 }) {
  const navigate = useNavigate();

  const getIcon = type => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'dispatch':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-amber-500" />;
    }
  };

  const displayed = notifications.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300" />
        No active notifications
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {displayed.map(notif => (
        <div
          key={notif.id}
          onClick={() => {
            if (onMarkRead) onMarkRead(notif.id);
            if (notif.link) navigate(notif.link);
          }}
          className={`p-3.5 flex items-start space-x-3 cursor-pointer hover:bg-slate-50 transition duration-150 ${
            !notif.isRead ? 'bg-blue-50/40' : ''
          }`}
        >
          <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
              <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                {formatTimeAgo(notif.timestamp)}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
