import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  GitFork,
  Ambulance,
  Building2,
  Trash2,
  Check,
  Filter,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTimeAgo, formatDate } from '../utils/formatters';
import { storageService } from '../services/storageService';

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshAllData
  } = useApp();

  const [filterType, setFilterType] = useState('ALL');

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'ALL') return true;
    if (filterType === 'UNREAD') return !n.isRead;
    return n.type === filterType;
  });

  const handleDeleteNotification = (id) => {
    const current = storageService.getNotifications();
    const updated = current.filter(n => n.id !== id);
    storageService.saveNotifications(updated);
    refreshAllData();
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all notification history?')) {
      storageService.saveNotifications([]);
      refreshAllData();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'emergency':
        return (
          <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'dispatch':
        return (
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
            <Ambulance className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
            <GitFork className="w-5 h-5" />
          </div>
        );
      case 'success':
        return (
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            System Notification Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time auditable operational alerts across Solapur ambulance dispatch, triage assessments, and graph reroutings.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition"
          >
            <Check className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl text-xs font-bold transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { label: 'All Alerts', value: 'ALL' },
          { label: 'Unread Only', value: 'UNREAD' },
          { label: 'Emergencies', value: 'emergency' },
          { label: 'Ambulance Dispatches', value: 'dispatch' },
          { label: 'Traffic & Roadblocks', value: 'warning' },
          { label: 'Completed Missions', value: 'success' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
              filterType === tab.value
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              className={`p-5 flex items-start space-x-4 transition hover:bg-slate-50/70 ${
                !notif.isRead ? 'bg-blue-50/30' : ''
              }`}
            >
              {getIcon(notif.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-slate-900 text-sm">{notif.title}</h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDate(notif.timestamp)} ({formatTimeAgo(notif.timestamp)})
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                <div className="mt-3 flex items-center space-x-3 text-xs">
                  {notif.link && (
                    <button
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        navigate(notif.link);
                      }}
                      className="text-blue-600 font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Open Workflow Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}

                  {!notif.isRead && (
                    <button
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      Mark as Read
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteNotification(notif.id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-16 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 text-base">No Notifications Found</p>
            <p className="text-xs text-slate-400 mt-0.5">Alerts appear dynamically as emergencies occur.</p>
          </div>
        )}
      </div>
    </div>
  );
}
