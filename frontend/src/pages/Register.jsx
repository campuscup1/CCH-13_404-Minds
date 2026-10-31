import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, User, Mail, Lock, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Chief Dispatch Officer');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const { loginUser } = useApp();
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email is required';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    loginUser(email, role);
    setSuccess(true);

    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-blue-500/10 overflow-hidden border border-blue-200">
        <div className="bg-gradient-to-r from-blue-600 to-sky-600 p-6 text-center text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto shadow-md mb-2">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black text-white">Create EMS Account</h2>
          <p className="text-xs text-blue-100">Register as a dispatcher or hospital administrator</p>
        </div>

        <div className="p-6">
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Registration successful! Launching command console...</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Officer Rajesh Kumar"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-blue-200 bg-blue-50/30 text-xs text-blue-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              {errors.name && <p className="text-[11px] text-blue-800 font-bold mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dispatch@ems-command.org"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-blue-200 bg-blue-50/30 text-xs text-blue-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              {errors.email && <p className="text-[11px] text-blue-800 font-bold mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-1">
                Role Designation
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-blue-200 bg-blue-50/30 text-xs text-blue-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Chief Dispatch Officer">Chief Dispatch Officer</option>
                  <option value="Station Supervisor">Ambulance Station Supervisor</option>
                  <option value="ER Bed Administrator">Hospital ER Bed Administrator</option>
                  <option value="Lead Paramedic">Fleet Lead Paramedic</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-blue-200 bg-blue-50/30 text-xs text-blue-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {errors.password && <p className="text-[10px] text-blue-800 font-bold mt-0.5">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-1">
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-blue-200 bg-blue-50/30 text-xs text-blue-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] text-blue-800 font-bold mt-0.5">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition mt-2"
            >
              Complete Registration
            </button>
          </form>
        </div>

        <div className="bg-blue-50/60 px-6 py-3 border-t border-blue-100 text-center text-xs text-blue-700">
          Already have an operational account?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
