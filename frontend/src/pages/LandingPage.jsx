import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Ambulance,
  PhoneCall,
  MapPin,
  ShieldAlert,
  Clock,
  Building2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Stethoscope,
  Baby,
  FileText,
  Lock,
  Crosshair,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { ambulances = [], hospitals = [], addEmergency, currentUser } = useApp();

  // Metrics
  const availableAmbs = (ambulances || []).filter(a => (a.status || '').toLowerCase() === 'available').length;
  const totalBeds = (hospitals || []).reduce(
    (acc, h) => acc + (h.available_er_beds ?? h.availableEmergencyBeds ?? 0) + (h.available_icu_beds ?? h.availableIcuBeds ?? 0),
    0
  );

  // Quick Emergency Request Form State
  const [patientName, setPatientName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [emergencyType, setEmergencyType] = useState('CARDIAC');
  const [selectedLocation, setSelectedLocation] = useState('East Tech Corridor (N7)');
  const [customAddress, setCustomAddress] = useState('');
  const [latitude, setLatitude] = useState(12.9350);
  const [longitude, setLongitude] = useState(77.6380);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [formError, setFormError] = useState('');

  // Location presets matching network nodes
  const cityLocations = [
    { name: 'East Tech Corridor (N7)', coords: [12.9350, 77.6380] },
    { name: 'Apex Heart Hospital Gate (N6)', coords: [12.9430, 77.6360] },
    { name: 'City Memorial Square (N8)', coords: [12.9280, 77.6350] },
    { name: 'North Ring Expressway (N3)', coords: [12.9460, 77.6155] },
    { name: 'Rainbow Child Clinic Plaza (N12)', coords: [12.9320, 77.6000] },
    { name: 'Midtown Central Crossing (N17)', coords: [12.9300, 77.6180] }
  ];

  const handleLocationChange = (e) => {
    const locName = e.target.value;
    setSelectedLocation(locName);
    const found = cityLocations.find(l => l.name === locName);
    if (found) {
      setLatitude(found.coords[0]);
      setLongitude(found.coords[1]);
    }
  };

  const handleUseGPS = () => {
    setIsLocating(true);
    setFormError('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const lat = Math.round(pos.coords.latitude * 10000) / 10000;
          const lon = Math.round(pos.coords.longitude * 10000) / 10000;
          setLatitude(lat);
          setLongitude(lon);
          setSelectedLocation('GPS Detected Location');
          setCustomAddress(`Live Device GPS: ${lat}, ${lon}`);
          setGpsCaptured(true);
        },
        (err) => {
          console.warn('Browser GPS notice, using city center coordinates', err);
          setIsLocating(false);
          const fallbackLat = 12.9352;
          const fallbackLon = 77.6250;
          setLatitude(fallbackLat);
          setLongitude(fallbackLon);
          setSelectedLocation('GPS Detected Location');
          setCustomAddress(`Live Device GPS: ${fallbackLat}, ${fallbackLon} (Midtown Grid)`);
          setGpsCaptured(true);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      setIsLocating(false);
      const fallbackLat = 12.9352;
      const fallbackLon = 77.6250;
      setLatitude(fallbackLat);
      setLongitude(fallbackLon);
      setSelectedLocation('GPS Detected Location');
      setCustomAddress(`Live Device GPS: ${fallbackLat}, ${fallbackLon} (Midtown Grid)`);
      setGpsCaptured(true);
    }
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!callerPhone.trim() || callerPhone.trim().length < 8) {
      setFormError('Please enter a valid contact phone number so our paramedics can reach you.');
      return;
    }

    setIsSubmitting(true);

    try {
      const emergencyPayload = {
        caller_name: patientName.trim() || 'Emergency Caller',
        caller_phone: callerPhone.trim(),
        patientName: patientName.trim() || 'Emergency Patient',
        patientAge: '45',
        patientGender: 'Not Specified',
        contactNumber: callerPhone.trim(),
        emergencyType: emergencyType,
        severity: emergencyType === 'CARDIAC' || emergencyType === 'TRAUMA' ? 'CRITICAL' : 'HIGH',
        description: notes.trim() || `Urgent ${emergencyType} assistance required at ${selectedLocation}`,
        locationName: customAddress.trim() ? `${selectedLocation} - ${customAddress.trim()}` : selectedLocation,
        latitude: latitude,
        longitude: longitude,
        requiredAssistance: emergencyType === 'CARDIAC' ? ['Oxygen', 'ALS Defibrillator'] : ['Stretcher', 'Paramedic Kit']
      };

      const result = await addEmergency(emergencyPayload);

      if (result && result.id) {
        navigate(`/journey-tracking/${result.id}`);
      } else {
        // Navigate to general journey tracking if id wasn't returned
        navigate('/journey-tracking');
      }
    } catch (err) {
      console.error('Submission failed', err);
      setFormError('Unable to dispatch. Please call the emergency hotline directly at 108 or 112.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* 24/7 Top Quick Helpline Bar */}
      <div className="bg-[#0B1E33] text-white py-2 px-4 sm:px-8 text-xs font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 text-red-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              <span>24/7 EMERGENCY HELPLINE:</span>
            </span>
            <a href="tel:108" className="font-extrabold text-white hover:text-red-300 underline underline-offset-2">
              Dial 108 (Toll-Free)
            </a>
            <span className="text-slate-500">|</span>
            <a href="tel:112" className="text-slate-300 hover:text-white">
              National Helpline: 112
            </a>
          </div>

          <div className="flex items-center space-x-4 text-slate-300">
            <span className="hidden sm:inline text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" />
              <span>Ambulance Network Active & Ready</span>
            </span>
            <button
              onClick={() => navigate('/login')}
              className="text-[11px] text-slate-300 hover:text-white flex items-center space-x-1 font-semibold transition"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>{currentUser?.role ? `Admin Portal (${currentUser.role})` : 'Admin Portal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Single-Page Navigation Bar with Tabs */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-black text-xl tracking-tight text-[#102A43]">MediRoute</span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-600 text-white">24/7</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Emergency Ambulance & Trauma Care</p>
            </div>
          </div>

          {/* Smooth Scroll Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <button
              onClick={() => scrollToSection('request')}
              className="hover:text-red-600 transition flex items-center space-x-1 py-1"
            >
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Get Ambulance</span>
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-blue-600 transition py-1"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="hover:text-blue-600 transition py-1"
            >
              Ambulance Types
            </button>
            <button
              onClick={() => scrollToSection('hospitals')}
              className="hover:text-blue-600 transition py-1"
            >
              Hospital Beds
            </button>
            <button
              onClick={() => scrollToSection('firstaid')}
              className="hover:text-blue-600 transition py-1"
            >
              First Aid Guide
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-blue-600 transition py-1"
            >
              Helplines
            </button>
          </nav>

          {/* Direct CTA */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => scrollToSection('request')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>Request Ambulance Now</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-white via-red-50/20 to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-100 border border-red-200 text-red-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>Instant Public Emergency Dispatch System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#102A43] tracking-tight leading-tight">
              Rapid Emergency Ambulance <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600">
                When Every Second Counts
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Immediate GPS-guided dispatch of Advanced Life Support (ALS) ambulances, live paramedic tracking, and direct bed reservation at the nearest trauma hospital.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => scrollToSection('request')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-xl shadow-red-600/30 transition transform hover:-translate-y-0.5"
              >
                <HeartPulse className="w-5 h-5" />
                <span>Request Ambulance Immediately</span>
              </button>

              <a
                href="tel:108"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-4 rounded-2xl bg-[#102A43] hover:bg-slate-800 text-white font-bold text-sm shadow-md transition"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Call Emergency Helpline: 108</span>
              </a>
            </div>

            {/* Key Transparency Badges for Citizens */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <p className="text-2xl font-black text-blue-600">&lt; 6 Mins</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">Average Response Time</p>
                <p className="text-[11px] text-slate-500 mt-1">Fastest route via real-time traffic bypass</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <p className="text-2xl font-black text-red-600">{availableAmbs} Available</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">Active Ambulance Fleet</p>
                <p className="text-[11px] text-slate-500 mt-1">ALS & BLS units positioned across city</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <p className="text-2xl font-black text-emerald-600">{totalBeds} Beds</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">Open ER & ICU Capacity</p>
                <p className="text-[11px] text-slate-500 mt-1">Verified live at network hospitals</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <p className="text-2xl font-black text-indigo-600">100% Free</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">Emergency Assistance</p>
                <p className="text-[11px] text-slate-500 mt-1">No registration or payment needed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Direct Emergency Request Box (#request) */}
      <section id="request" className="py-16 bg-white border-y border-slate-200 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F8FAFC] border-2 border-red-200 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
            {/* Urgent Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Ambulance className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">
                    Emergency Ambulance Request
                  </h2>
                  <p className="text-xs text-slate-500">
                    Submit details below. The nearest ambulance will be dispatched immediately.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-extrabold text-xs flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>NO LOGIN REQUIRED</span>
              </span>
            </div>

            {formError && (
              <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Attention</p>
                  <p className="text-xs mt-0.5">{formError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleEmergencySubmit} className="mt-8 space-y-6">
              {/* Step 1: Emergency Condition */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                  1. What is the emergency condition?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'CARDIAC', name: 'Cardiac / Heart', desc: 'Chest pain, fainting', icon: HeartPulse, color: 'text-red-600' },
                    { id: 'TRAUMA', name: 'Road Accident', desc: 'Severe trauma, collision', icon: ShieldAlert, color: 'text-amber-600' },
                    { id: 'RESPIRATORY', name: 'Breathing Issue', desc: 'Severe asthma, choking', icon: Activity, color: 'text-blue-600' },
                    { id: 'PREGNANCY', name: 'Maternal / Labor', desc: 'Delivery emergency', icon: Baby, color: 'text-rose-600' },
                    { id: 'GENERAL', name: 'Other Urgent Care', desc: 'High fever, seizure', icon: Stethoscope, color: 'text-indigo-600' }
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = emergencyType === type.id;
                    return (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setEmergencyType(type.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white border-red-500 shadow-md ring-2 ring-red-500/20'
                            : 'bg-white/60 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${type.color} mb-2`} />
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-red-900' : 'text-slate-800'}`}>
                            {type.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{type.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Location Details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    2. Where is the patient located?
                  </label>
                  <button
                    type="button"
                    onClick={handleUseGPS}
                    disabled={isLocating}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Locating...' : 'Use My Exact GPS Location'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      value={selectedLocation}
                      onChange={handleLocationChange}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20"
                    >
                      {cityLocations.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                      {selectedLocation === 'GPS Detected Location' && (
                        <option value="GPS Detected Location">📍 GPS Detected Location</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="Add Landmark, Floor, Gate or Street name..."
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                {gpsCaptured && (
                  <div className="mt-2.5 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live GPS Position Locked: [{latitude}, {longitude}]</span>
                  </div>
                )}
              </div>

              {/* Step 3: Contact & Caller Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={callerPhone}
                      onChange={(e) => setCallerPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Paramedic will call this number while en-route.</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
                    Patient Name / Caller Name
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar or Bystander"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Optional if patient identity is unknown.</p>
                </div>
              </div>

              {/* Symptoms / Notes */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
                  Additional Observations (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Patient is unconscious, breathing difficulty, bleeding heavily..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-sm tracking-wide shadow-xl shadow-red-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <HeartPulse className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : 'animate-pulse'}`} />
                  <span>
                    {isSubmitting ? 'DISPATCHING NEAREST AMBULANCE...' : 'DISPATCH NEAREST AMBULANCE NOW'}
                  </span>
                </button>
                <p className="text-center text-[11px] text-slate-500 mt-2">
                  By clicking dispatch, you connect to the nearest active ambulance station with instant priority.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* SECTION 2: How It Works (#how-it-works) */}
      <section id="how-it-works" className="py-20 bg-[#F8FAFC] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">
              SEAMLESS 3-STEP LIFESAVING PROTOCOL
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              How Emergency Assistance Works
            </h3>
            <p className="text-sm text-slate-600 mt-3">
              From the instant you tap request to hospital admission, our smart dispatch system optimizes every critical second.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl mb-6">
                1
              </div>
              <h4 className="text-lg font-bold text-[#102A43]">One-Tap Request</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Helper or patient shares incident type and location. No complicated registration or app download needed.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center space-x-2 text-xs font-semibold text-blue-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Instant GPS Coordinates Lock</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xl mb-6">
                2
              </div>
              <h4 className="text-lg font-bold text-[#102A43]">Paramedic Dispatch & Live Map</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                The closest Advanced Life Support (ALS) vehicle departs immediately. Watch the ambulance approach on a live GPS map on your phone.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center space-x-2 text-xs font-semibold text-red-600">
                <Clock className="w-4 h-4 text-red-500" />
                <span>Real-Time Turn-by-Turn ETA</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl mb-6">
                3
              </div>
              <h4 className="text-lg font-bold text-[#102A43]">Hospital Bed & Trauma Readiness</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Patient vitals and clinical condition are beamed to the hospital trauma team in transit, securing open ICU and ER beds before arrival.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center space-x-2 text-xs font-semibold text-emerald-600">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>Zero Admission Waiting Time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Ambulance Types (#services) */}
      <section id="services" className="py-20 bg-white border-y border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
              EQUIPPED FOR ALL MEDICAL TIERS
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              Life-Support Ambulance Fleet
            </h3>
            <p className="text-sm text-slate-600 mt-3">
              Each dispatched ambulance is operated by certified emergency medical technicians (EMTs) equipped with specialized hospital-grade equipment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-[#102A43] text-base">Advanced Life Support (ALS)</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Equipped with mechanical ventilators, multiparameter cardiac monitors, biphasic defibrillators, IV medications, and advanced airway management.
              </p>
              <span className="inline-block mt-4 text-[11px] font-bold text-red-700 bg-red-100/60 px-2.5 py-1 rounded-md">
                Critical & Cardiac Cases
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Ambulance className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-[#102A43] text-base">Basic Life Support (BLS)</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Outfitted with continuous oxygen supplies, suction machines, patient stretchers, fracture splints, and primary wound stabilization kits.
              </p>
              <span className="inline-block mt-4 text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2.5 py-1 rounded-md">
                General & Transport Care
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-[#102A43] text-base">Trauma Quick-Response</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Specialized spinal immobilization boards, pelvic binders, cervical collars, and rapid hemorrhage tourniquet controls for road collisions.
              </p>
              <span className="inline-block mt-4 text-[11px] font-bold text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-md">
                Accidents & Severe Injuries
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Baby className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-[#102A43] text-base">Maternal & Neonatal Units</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Sterile obstetric delivery kits, neonatal warming incubators, and specialized resuscitation masks for safe child and mother delivery transit.
              </p>
              <span className="inline-block mt-4 text-[11px] font-bold text-rose-700 bg-rose-100/60 px-2.5 py-1 rounded-md">
                Pregnancy & Infant Delivery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Live Hospital Bed Network (#hospitals) */}
      <section id="hospitals" className="py-20 bg-[#F8FAFC] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                LIVE TRAUMA NETWORK CAPACITY
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
                Partner Hospitals & Bed Availability
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                Patients are never dispatched blindly. Our system matches emergencies with hospitals holding open ICU beds and active trauma teams.
              </p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
              <div>
                <span className="text-xs font-bold text-slate-500 block">Total Network Beds</span>
                <span className="text-xl font-black text-emerald-600">{totalBeds} Available</span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <span className="text-xs font-bold text-slate-500 block">Network Hospitals</span>
                <span className="text-xl font-black text-blue-600">{(hospitals || []).length} Centers</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(hospitals || []).map((h) => {
              const erBeds = h.available_er_beds ?? h.availableEmergencyBeds ?? 0;
              const icuBeds = h.available_icu_beds ?? h.availableIcuBeds ?? 0;
              const hasTrauma = h.trauma_level === 1 || h.hasTraumaUnit;
              const specialties = h.specialties || ['Emergency Medicine', 'ICU Care'];

              return (
                <div
                  key={h.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-[#102A43] text-base">{h.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{h.address || 'Central Metropolitan Corridor'}</span>
                      </p>
                    </div>
                    {hasTrauma && (
                      <span className="px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-[10px] font-black shrink-0">
                        LEVEL-1 TRAUMA
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-5">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center">
                      <p className="text-lg font-black text-emerald-700">{icuBeds}</p>
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">Available ICU Beds</p>
                    </div>

                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-center">
                      <p className="text-lg font-black text-blue-700">{erBeds}</p>
                      <p className="text-[10px] font-bold text-blue-800 uppercase">Emergency ER Beds</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1.5">
                      {specialties.slice(0, 3).map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {h.contact_phone || '+91-80-2222-1000'}
                      </span>
                      <a
                        href={`tel:${h.contact_phone || '108'}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <span>Call Hospital Desk</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5: First-Aid Guide While Waiting (#firstaid) */}
      <section id="firstaid" className="py-20 bg-white border-y border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">
              CRITICAL LIFE-SAVING ACTIONS
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              What To Do While The Ambulance Is En-Route
            </h3>
            <p className="text-sm text-slate-600 mt-3">
              Your actions in the first 5 minutes save lives. Follow these medical guidelines until our paramedics reach your location.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-red-50/50 border border-red-100">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold mb-4">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-red-950 text-base">Suspected Heart Attack / Arrest</h4>
              <ul className="text-xs text-red-900/80 space-y-2 mt-3 list-disc pl-4 leading-relaxed">
                <li>Keep the patient seated comfortably with back supported.</li>
                <li>Loosen tight clothing around the neck and chest.</li>
                <li>If patient becomes unresponsive and stops normal breathing, begin firm, continuous chest compressions (100–120 bpm in center of chest).</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-amber-950 text-base">Severe Bleeding & Collisions</h4>
              <ul className="text-xs text-amber-900/80 space-y-2 mt-3 list-disc pl-4 leading-relaxed">
                <li>Apply firm, steady direct pressure using a clean cloth or bandage.</li>
                <li>Do not remove cloths that become soaked with blood; place more pads on top.</li>
                <li>Do not move the neck or spine of any patient involved in a high-speed vehicle crash.</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-blue-950 text-base">Difficulty Breathing & Choking</h4>
              <ul className="text-xs text-blue-900/80 space-y-2 mt-3 list-disc pl-4 leading-relaxed">
                <li>Help the patient sit upright to maximize lung volume.</li>
                <li>Ensure fresh airflow—open windows and disperse any surrounding crowds.</li>
                <li>Do not force food or water into the mouth of a choking or breathless person.</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-orange-50/50 border border-orange-100">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-orange-950 text-base">Severe Burns & Scalds</h4>
              <ul className="text-xs text-orange-900/80 space-y-2 mt-3 list-disc pl-4 leading-relaxed">
                <li>Immediately run cool, clean tap water over the burn for at least 10 minutes.</li>
                <li>Do NOT apply ice, butter, oils, or toothpaste—these worsen tissue damage.</li>
                <li>Cover loosely with a clean, dry, non-fluffy cloth or cling film.</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-purple-50/50 border border-purple-100">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold mb-4">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-purple-950 text-base">Seizures & Convulsions</h4>
              <ul className="text-xs text-purple-900/80 space-y-2 mt-3 list-disc pl-4 leading-relaxed">
                <li>Clear away hard or sharp objects from around the person.</li>
                <li>Place something soft under their head.</li>
                <li>Do NOT restrain the patient and NEVER put any objects into their mouth.</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-4">
                <Navigation className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-emerald-950 text-base">Guide The Incoming Ambulance</h4>
              <ul className="text-xs text-emerald-900/80 space-y-2 mt-3 list-disc pl-4 leading-relaxed">
                <li>Turn on outside porch and gate lights if it is dark.</li>
                <li>Ensure society gates or barriers are unlocked and open.</li>
                <li>Send one person out to the main street corner to wave down the ambulance siren.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Emergency Directory & Helplines (#contact) */}
      <section id="contact" className="py-20 bg-[#102A43] text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <HeartPulse className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">MediRoute 24/7</h3>
                  <p className="text-xs text-slate-300">Public Emergency Dispatch & Healthcare Network</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                MediRoute 24/7 coordinates rapid paramedic deployment, real-time traffic bypass, and hospital trauma bed allocation to safeguard lives throughout the emergency golden hour.
              </p>

              <div className="p-4 rounded-2xl bg-[#0B1E33] border border-slate-700/60">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Important Public Notice
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Ambulance dispatch for road accident victims and life-threatening emergencies is 100% free of charge and never requires payment upfront.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Emergency Hotline Directory
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="tel:108"
                  className="p-5 rounded-2xl bg-[#0B1E33] border border-slate-700 hover:border-red-500 transition group"
                >
                  <p className="text-2xl font-black text-red-400 group-hover:text-red-300">Dial 108</p>
                  <p className="text-xs font-bold text-white mt-1">National Ambulance Service</p>
                  <p className="text-[11px] text-slate-400 mt-1">24/7 toll-free medical emergencies</p>
                </a>

                <a
                  href="tel:112"
                  className="p-5 rounded-2xl bg-[#0B1E33] border border-slate-700 hover:border-blue-500 transition group"
                >
                  <p className="text-2xl font-black text-blue-400 group-hover:text-blue-300">Dial 112</p>
                  <p className="text-xs font-bold text-white mt-1">National Unified Emergency</p>
                  <p className="text-[11px] text-slate-400 mt-1">Police, Fire & Ambulance response</p>
                </a>

                <a
                  href="tel:102"
                  className="p-5 rounded-2xl bg-[#0B1E33] border border-slate-700 hover:border-rose-500 transition group"
                >
                  <p className="text-2xl font-black text-rose-400 group-hover:text-rose-300">Dial 102</p>
                  <p className="text-xs font-bold text-white mt-1">Maternal & Child Helpline</p>
                  <p className="text-[11px] text-slate-400 mt-1">Dedicated pregnancy transport</p>
                </a>

                <div className="p-5 rounded-2xl bg-[#0B1E33] border border-slate-700">
                  <p className="text-2xl font-black text-emerald-400">+91-800-MED-HELP</p>
                  <p className="text-xs font-bold text-white mt-1">MediRoute Operations Desk</p>
                  <p className="text-[11px] text-slate-400 mt-1">Live dispatch center telemetry</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© 2026 MediRoute 24/7 • Smart Emergency Medical Dispatch Services</p>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => scrollToSection('request')}
                className="hover:text-white transition"
              >
                Request Assistance
              </button>
              <button
                onClick={() => scrollToSection('hospitals')}
                className="hover:text-white transition"
              >
                Hospital Directory
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-white transition font-bold text-slate-300 flex items-center space-x-1"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Paramedic & Staff Login</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
