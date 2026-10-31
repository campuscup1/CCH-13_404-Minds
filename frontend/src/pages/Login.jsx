import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, PhoneCall, Zap, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginUser, logoutUser } = useApp();
  const navigate = useNavigate();

  const handleQuickLogin = async (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setErrorMsg('');
    setIsLoading(true);

    const res = await loginUser(demoUser, demoPass);
    setIsLoading(false);

    if (res.success) {
      if ((res.user?.role || '').toUpperCase() === 'DRIVER') {
        logoutUser();
        setErrorMsg('Driver role has moved to the Mobile App. Ambulance drivers must use the MediRoute Driver Android application.');
        return;
      }
      setSuccessMsg(`Authenticated as Station Admin! Opening Command Center...`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please check backend status or use demo button.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const res = await loginUser(username, password);
    setIsLoading(false);

    if (res.success) {
      if ((res.user?.role || '').toUpperCase() === 'DRIVER') {
        logoutUser();
        setErrorMsg('Driver role has moved to the Mobile App. Ambulance drivers must use the MediRoute Driver Android application.');
        return;
      }
      setSuccessMsg(`Authenticated as Station Admin! Opening Command Center...`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } else {
      setErrorMsg(res.error || 'Invalid credentials. Default admin: admin / admin123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#102A43] via-[#0B1E33] to-[#061325] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50">
        {/* Header */}
        <div className="bg-[#0B1E33] p-8 text-center border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 mb-3">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Ambulance Station Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Authorized Command Center Access for Dispatch Operations</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Authentication Notice</p>
                <p className="text-[11px] text-red-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Client No-Login Callout */}
          <div className="mb-4 p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-900">Public Patient or Helper?</p>
              <p className="text-[11px] text-amber-700">No login required to request emergency ambulance dispatch.</p>
            </div>
            <Link
              to="/emergencies"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center space-x-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Request Help</span>
            </Link>
          </div>

          {/* Driver Mobile App Notice */}
          <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Ambulance Driver Terminal</p>
              <p className="text-[11px] text-slate-500">Drivers operate exclusively via the Android Mobile App with live siren alarm & GPS navigation.</p>
            </div>
          </div>

          {/* 1-Click Fast Admin Demo Login */}
          <div className="mb-6 p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl">
            <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Quick Demo Access</span>
            </p>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition text-center flex items-center justify-center space-x-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>1-Click Sign In as Station Admin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#102A43] hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In as Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Smart EMS Dispatch System</span>
          <Link to="/" className="text-blue-600 font-bold hover:underline">
            Public Home Page ➔
          </Link>
        </div>
      </div>
    </div>
  );
}
