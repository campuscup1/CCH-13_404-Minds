import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Sliders,
  Globe,
  Bell,
  RotateCcw,
  LogOut,
  CheckCircle2,
  Lock,
  Cpu,
  Save
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const navigate = useNavigate();
  const { currentUser, logoutUser, resetAllData, algorithmPreference, setAlgorithmPreference } = useApp();

  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(currentUser?.name || 'Admin Dispatcher');
  const [email, setEmail] = useState(currentUser?.email || 'admin@mediroute.ai');
  const [role, setRole] = useState(currentUser?.role || 'Chief Dispatch Officer');
  const [language, setLanguage] = useState('en');
  const [successMsg, setSuccessMsg] = useState('');

  // Configurable Algorithm Weights
  const [facilityWeight, setFacilityWeight] = useState(40);
  const [capacityWeight, setCapacityWeight] = useState(30);
  const [travelTimeWeight, setTravelTimeWeight] = useState(30);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSuccessMsg('Admin profile updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveWeights = (e) => {
    e.preventDefault();
    const sum = Number(facilityWeight) + Number(capacityWeight) + Number(travelTimeWeight);
    if (sum !== 100) {
      alert(`The weights must sum to 100%. Current sum: ${sum}%`);
      return;
    }
    setSuccessMsg('Hospital recommendation algorithm weights saved!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all ambulances, hospitals, emergencies, and stations to factory demo state?')) {
      resetAllData();
      alert('Prototype data reset to initial scenario.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            System Settings & Preferences
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure dispatcher account, fine-tune algorithmic scoring weights, and manage demo datasets.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-200 transition self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-3 text-xs font-bold text-slate-600">
        {[
          { id: 'profile', label: 'Admin Profile', icon: User },
          { id: 'algorithm', label: 'Algorithm Tuning', icon: Sliders },
          { id: 'preferences', label: 'Preferences & Regional', icon: Globe },
          { id: 'maintenance', label: 'Prototype Maintenance', icon: RotateCcw }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100">
            Dispatcher Profile & Credentials
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Command Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold bg-white"
              >
                <option value="Chief Dispatch Officer">Chief Dispatch Officer</option>
                <option value="Hospital Administrator">Hospital Administrator</option>
                <option value="Paramedic Field Team">Paramedic Field Team</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

      {/* Algorithm Tuning Tab */}
      {activeTab === 'algorithm' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Hospital Recommendation Formula Weight Tuning
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Adjust how the recommendation engine balances medical capability vs capacity vs road distance.
            </p>
          </div>

          <form onSubmit={handleSaveWeights} className="space-y-6 text-xs max-w-xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Facility Service Match Weight</span>
                <span className="font-extrabold text-blue-600 text-sm">{facilityWeight}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={facilityWeight}
                onChange={(e) => setFacilityWeight(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-slate-400">
                Weight given to hospitals operating specialized trauma, cardiac, and ICU departments.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Capacity & Bed Availability Weight</span>
                <span className="font-extrabold text-emerald-600 text-sm">{capacityWeight}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={capacityWeight}
                onChange={(e) => setCapacityWeight(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <p className="text-[11px] text-slate-400">
                Weight given to hospitals with a higher ratio of available emergency and ICU beds.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Travel Time & ETA Proximity Weight</span>
                <span className="font-extrabold text-indigo-600 text-sm">{travelTimeWeight}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={travelTimeWeight}
                onChange={(e) => setTravelTimeWeight(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-[11px] text-slate-400">
                Weight given to lower road transit minutes calculated via Dijkstra/A*.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between font-bold">
              <span>Total Combined Weight:</span>
              <span className={`text-sm ${Number(facilityWeight) + Number(capacityWeight) + Number(travelTimeWeight) === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                {Number(facilityWeight) + Number(capacityWeight) + Number(travelTimeWeight)}% (Must equal 100%)
              </span>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              Update Algorithm Weights
            </button>
          </form>
        </div>
      )}

      {/* Regional & Language Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100">
            Regional Preferences & Language
          </h3>

          <div className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold bg-white"
              >
                <option value="en">English (Official System Default)</option>
                <option value="mr">मराठी (Marathi - Regional State Language)</option>
                <option value="hi">हिन्दी (Hindi - National Language)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Scenario Region</label>
              <input
                type="text"
                disabled
                value="Solapur Urban & Industrial Sector, Maharashtra (17.6599° N, 75.9064° E)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Prototype Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base text-red-600">
              Prototype Reset & Evaluation Controls
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Used during hackathon demonstration to return the application state to the fresh initial Solapur scenario.
            </p>
          </div>

          <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 space-y-3 max-w-xl">
            <p className="font-bold">Factory State Reset</p>
            <p className="text-[11px] leading-relaxed">
              This resets all sample ambulances (8+), hospitals (6+), stations (4+), and initial emergency requests stored in your browser's LocalStorage back to their default demo values.
            </p>

            <button
              onClick={handleResetData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition"
            >
              Reset All Prototype Data to Factory State
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
