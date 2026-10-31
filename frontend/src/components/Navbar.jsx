import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  AlertOctagon
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar({ onToggleSidebar }) {
  const {
    notifications = [],
    blockedEdgeIds = new Set()
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const unreadNotifications = (notifications || []).filter(n => !n.isRead);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Station Operations Dashboard';
    if (path.startsWith('/emergencies')) return 'Emergency Call Intake';
    if (path.startsWith('/journey-tracking')) return 'Two-Stage Journey Tracking';
    if (path.startsWith('/dynamic-routing')) return 'Dynamic Roadblock & Reroute Simulator';
    if (path.startsWith('/ambulances')) return 'Ambulance Fleet Status';
    if (path.startsWith('/stations')) return 'Ambulance Stations';
    if (path.startsWith('/hospitals')) return 'Hospital Facilities & Bed Capacities';
    if (path.startsWith('/analytics')) return 'System Analytics & Performance';
    if (path.startsWith('/notifications')) return 'Notification Center';
    return 'Smart EMS Dispatch Portal';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left: Mobile hamburger & Clean Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Clean minimal controls */}
      <div className="flex items-center space-x-3">
        {/* Dynamic Blockage Alert Pill (Only shown when active) */}
        {(blockedEdgeIds?.size || 0) > 0 && (
          <div
            onClick={() => navigate('/dynamic-routing')}
            className="flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-bold cursor-pointer hover:bg-amber-100 transition animate-pulse"
            title="Roadblock active! Click to inspect rerouting."
          >
            <AlertOctagon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">{blockedEdgeIds?.size || 0} Roadblock Active</span>
          </div>
        )}

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 text-slate-600 hover:text-blue-600 rounded-xl hover:bg-blue-50 relative transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notifications ({unreadNotifications.length})
                </span>
                <button
                  onClick={() => {
                    setShowNotifMenu(false);
                    navigate('/notifications');
                  }}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {(notifications || []).slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifMenu(false);
                      if (n.link) navigate(n.link);
                    }}
                    className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                      !n.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <p className="font-bold text-slate-800">{n.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
