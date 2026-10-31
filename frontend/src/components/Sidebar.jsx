import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  GitFork,
  Bell,
  Ambulance,
  Building2,
  AlertTriangle,
  LogOut,
  X,
  HeartPulse
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ isOpen, onClose }) {
  const { notifications = [], currentUser, logoutUser } = useApp();
  const navigate = useNavigate();

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;
  const userRole = currentUser?.role || 'CLIENT';

  // Clean, focused navigation tabs per role
  let navItems = [];

  if (userRole === 'ADMIN') {
    navItems = [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { name: 'Active Dispatches', to: '/journey-tracking', icon: Radio },
      { name: 'Traffic Simulator', to: '/dynamic-routing', icon: GitFork },
      {
        name: 'Notifications',
        to: '/notifications',
        icon: Bell,
        badge: unreadCount > 0 ? unreadCount : null
      }
    ];
  } else if (userRole === 'DRIVER') {
    navItems = [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { name: 'My Active Mission', to: '/journey-tracking', icon: Radio },
      { name: 'Ambulance Fleet', to: '/ambulances', icon: Ambulance },
      { name: 'Hospital Network', to: '/hospitals', icon: Building2 },
      {
        name: 'Alerts',
        to: '/notifications',
        icon: Bell,
        badge: unreadCount > 0 ? unreadCount : null
      }
    ];
  } else {
    // PUBLIC CLIENT / GUEST
    navItems = [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { name: 'Live Journey Tracker', to: '/journey-tracking', icon: Radio },
      { name: 'Hospital Directory', to: '/hospitals', icon: Building2 },
      { name: 'Request Assistance', to: '/emergencies', icon: AlertTriangle }
    ];
  }

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Persistent Sidebar with Light Blue Theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#EBF3FF] border-r border-blue-200/80 text-slate-800 flex flex-col shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-200/60 bg-[#E1EDFF]">
          <div
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => navigate(userRole === 'ADMIN' ? '/dashboard' : '/')}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-[#102A43]">
                MediRoute
              </span>
              <span className="text-[10px] font-black ml-1 px-1.5 py-0.5 rounded bg-blue-600 text-white">
                24/7
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-blue-200/50 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Navigation Tabs Only */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-700 hover:bg-blue-100 hover:text-blue-900'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 opacity-90" />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Clean Sign Out / In Link */}
        <div className="p-4 border-t border-blue-200/60 bg-[#E1EDFF]">
          {currentUser ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 transition"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
                <span className="truncate max-w-[120px]">{currentUser.username}</span>
              </div>
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition text-center"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
