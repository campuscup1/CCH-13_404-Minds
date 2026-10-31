import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  MapPin,
  Phone,
  User,
  Clock,
  Ambulance,
  Building2,
  AlertTriangle,
  Radio,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Activity,
  RefreshCw,
  RotateCcw,
  GitFork,
  Bed,
  Plus,
  Minus,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    adminOverview,
    emergencies = [],
    ambulances = [],
    hospitals = [],
    stations = [],
    currentUser,
    refreshAllData,
    resetAllData,
    updateHospitalBeds
  } = useApp();

  const [activeTab, setActiveTab] = useState('emergencies'); // 'emergencies', 'fleet', 'hospitals', 'stations'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bedUpdatingId, setBedUpdatingId] = useState(null);

  // Derive metrics from adminOverview or live state
  const metrics = adminOverview?.metrics || {
    total_ambulances: ambulances.length || 6,
    available_ambulances: ambulances.filter(a => (a.status || '').toUpperCase() === 'AVAILABLE').length,
    dispatched_ambulances: ambulances.filter(a => (a.status || '').toUpperCase() !== 'AVAILABLE').length,
    active_emergencies: emergencies.filter(e => e.journey_stage !== 'COMPLETED' && e.status !== 'COMPLETED').length,
    total_hospitals: hospitals.length || 4,
    available_icu_beds: hospitals.reduce((sum, h) => sum + (h.available_icu_beds ?? h.availableIcuBeds ?? 0), 0),
    available_er_beds: hospitals.reduce((sum, h) => sum + (h.available_er_beds ?? h.availableEmergencyBeds ?? 0), 0)
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
  };

  const handleResetSystem = async () => {
    if (window.confirm('Reset entire system state to pristine demo seeds (stations, fleet, hospitals, and roadblock status)?')) {
      setIsResetting(true);
      await resetAllData();
      setIsResetting(false);
    }
  };

  const handleBedChange = async (hospId, bedType, delta) => {
    const hosp = hospitals.find(h => h.id === hospId);
    if (!hosp) return;

    const currentIcu = hosp.available_icu_beds ?? hosp.availableIcuBeds ?? 0;
    const currentEr = hosp.available_er_beds ?? hosp.availableEmergencyBeds ?? 0;

    const newIcu = bedType === 'icu' ? Math.max(0, currentIcu + delta) : currentIcu;
    const newEr = bedType === 'er' ? Math.max(0, currentEr + delta) : currentEr;

    setBedUpdatingId(hospId);
    await updateHospitalBeds(hospId, newIcu, newEr);
    setBedUpdatingId(null);
  };

  // Filtered Emergencies
  const filteredEmergencies = emergencies.filter(e => {
    const pName = e.patient_name || e.patientName || '';
    const loc = e.pickup_address || e.locationName || '';
    const phone = e.caller_phone || e.contactNumber || '';
    const cat = e.category || e.emergencyType || '';

    const matchesSearch =
      pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      cat.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const sev = (e.severity || '').toUpperCase();
    if (filterSeverity === 'CRITICAL') return sev === 'CRITICAL';
    if (filterSeverity === 'HIGH') return sev === 'HIGH';
    if (filterSeverity === 'ACTIVE') return e.journey_stage !== 'COMPLETED' && e.status !== 'COMPLETED';

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Admin Command Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>STATION ADMIN COMMAND CENTER</span>
            </span>
            <span className="text-xs font-bold text-slate-500">
              Operator: <span className="text-slate-800 font-extrabold">{adminOverview?.admin_name || currentUser?.username || 'admin'}</span>
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-[#102A43] tracking-tight mt-1.5">
            Emergency Operations & Fleet Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live synchronization with backend dispatch algorithm, ambulance fleet status, dynamic traffic simulation, and hospital bed availability.
          </p>
        </div>

        {/* Command Center Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync Live</span>
          </button>

          <button
            onClick={() => navigate('/dynamic-routing')}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Traffic Simulator</span>
          </button>

          <button
            onClick={handleResetSystem}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo State</span>
          </button>

          <button
            onClick={() => navigate('/emergencies')}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Emergency</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Stat Cards (Connected directly to backend GET /api/admin/overview) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Active Emergencies */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Incidents</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600">{metrics.active_emergencies}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1">Under active dispatch</span>
        </div>

        {/* Available Ambulances */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Fleet</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{metrics.available_ambulances}</span>
            <span className="text-xs font-bold text-slate-400">/ {metrics.total_ambulances}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1">Ready at stations</span>
        </div>

        {/* Dispatched Ambulances */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dispatched</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600">{metrics.dispatched_ambulances}</span>
            <Ambulance className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-[11px] text-blue-700 font-semibold mt-1">En-route / At scene</span>
        </div>

        {/* Available ICU Beds */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ICU Beds Open</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">{metrics.available_icu_beds}</span>
            <HeartPulse className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-[11px] text-purple-700 font-semibold mt-1">Across 4 hospitals</span>
        </div>

        {/* Available ER Beds */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ER Beds Open</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-600">{metrics.available_er_beds}</span>
            <Bed className="w-4 h-4 text-cyan-500" />
          </div>
          <span className="text-[11px] text-cyan-700 font-semibold mt-1">Emergency bays</span>
        </div>

        {/* Hospital Facilities */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destinations</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">{metrics.total_hospitals}</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1">Level-1 & Specialty</span>
        </div>
      </div>

      {/* Navigation Tabs for Operations Console */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {[
            { id: 'emergencies', label: 'Emergency Dispatches', count: emergencies.length },
            { id: 'fleet', label: 'Ambulance Fleet Telemetry', count: ambulances.length },
            { id: 'hospitals', label: 'Hospital Bed Capacity', count: hospitals.length },
            { id: 'stations', label: 'Dispatch Stations', count: stations.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'emergencies' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, location..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="ACTIVE">Active Only</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: EMERGENCY DISPATCHES (Connected to GET /api/admin/emergencies) */}
      {activeTab === 'emergencies' && (
        <div className="space-y-4">
          {filteredEmergencies.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">No emergency incidents matching criteria</p>
              <p className="text-xs text-slate-400 mt-1">Submit a new request from Emergency Intake or Reset Demo State.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmergencies.map((emg) => {
                const isCritical = (emg.severity || '').toUpperCase() === 'CRITICAL';
                const isCompleted = emg.journey_stage === 'COMPLETED' || emg.status === 'COMPLETED';

                return (
                  <div
                    key={emg.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                            isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {emg.severity || 'HIGH'}
                          </span>
                          <span className="text-xs font-black text-slate-400">{emg.id}</span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {emg.category || 'EMERGENCY'}
                        </span>
                      </div>

                      {/* Patient Details */}
                      <div className="mt-3 flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-base text-[#102A43]">
                            {emg.patient_name || emg.patientName || 'Emergency Patient'}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {emg.patient_age || emg.patientAge || 40} yrs • Caller: {emg.caller_name || 'Bystander'}
                          </p>
                        </div>
                      </div>

                      {/* Location & Contact */}
                      <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-slate-700 font-medium truncate">
                            {emg.pickup_address || emg.locationName || 'City Coordinates'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{emg.caller_phone || emg.contactNumber || '+91-99999-88888'}</span>
                        </div>
                      </div>

                      {/* Assigned Fleet Details */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100">
                          <span className="text-blue-500 font-bold block text-[10px]">Ambulance</span>
                          <span className="font-extrabold text-blue-950 truncate block">
                            {emg.assigned_ambulance_id || 'Auto Dispatched'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                          <span className="text-purple-500 font-bold block text-[10px]">Hospital</span>
                          <span className="font-extrabold text-purple-950 truncate block">
                            {emg.destination_hospital_id || 'MCDA Evaluating'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Status & Track Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[11px] font-bold flex items-center space-x-1.5 ${
                        isCompleted ? 'text-emerald-700' : 'text-blue-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600 animate-ping'}`} />
                        <span className="truncate max-w-[150px]">{emg.journey_stage || 'DISPATCHED'}</span>
                      </span>

                      <button
                        onClick={() => navigate(`/journey-tracking/${emg.id}`)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#102A43] hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
                      >
                        <Radio className="w-3 h-3 text-blue-400" />
                        <span>Track</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: AMBULANCE FLEET TELEMETRY (Connected to GET /api/admin/ambulances) */}
      {activeTab === 'fleet' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Active Fleet Telemetry</h3>
              <p className="text-xs text-slate-500">Live units registered in the emergency dispatch grid</p>
            </div>
            <button
              onClick={() => navigate('/ambulances')}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
            >
              Manage Fleet ➔
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ambulances.map((amb) => {
              const isAvailable = (amb.status || '').toUpperCase() === 'AVAILABLE';

              return (
                <div
                  key={amb.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                        <Ambulance className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {amb.vehicle_number || amb.vehicleNumber || amb.id}
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase">
                          {amb.vehicle_type || amb.type || 'ALS'} UNIT
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {amb.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Station Depot:</span>
                      <span className="font-bold text-slate-800">{amb.station_id || 'STN_CENTRAL'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Node:</span>
                      <span className="font-bold text-slate-800">{amb.current_node_id || amb.currentNodeId || 'N1'}</span>
                    </div>
                  </div>

                  {amb.equipment && amb.equipment.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Equipment:</span>
                      <div className="flex flex-wrap gap-1">
                        {amb.equipment.map((eq, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-700">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: HOSPITAL BED CAPACITY (Connected to GET & PUT /api/admin/hospitals) */}
      {activeTab === 'hospitals' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Live Destination Hospital Capacity</h3>
              <p className="text-xs text-slate-500">
                Adjust ICU & ER beds dynamically; updates backend Multi-Criteria Decision Algorithm (MCDA) instantly.
              </p>
            </div>
            <button
              onClick={() => navigate('/hospitals')}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
            >
              Hospital Directory ➔
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hospitals.map((hosp) => {
              const icuAvail = hosp.available_icu_beds ?? hosp.availableIcuBeds ?? 0;
              const icuTotal = hosp.total_icu_beds ?? hosp.totalIcuBeds ?? 20;
              const erAvail = hosp.available_er_beds ?? hosp.availableEmergencyBeds ?? 0;
              const erTotal = hosp.total_er_beds ?? hosp.totalEmergencyBeds ?? 35;
              const isUpdating = bedUpdatingId === hosp.id;

              return (
                <div
                  key={hosp.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{hosp.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Node {hosp.nearest_node_id || 'N10'} • Trauma Level {hosp.trauma_level || 1}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800">
                      Level {hosp.trauma_level || 1} Center
                    </span>
                  </div>

                  {/* ICU & ER Bed Adjusters */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {/* ICU Box */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Available ICU</span>
                        <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-black text-purple-700">{icuAvail}</span>
                        <span className="text-xs text-slate-400 font-bold">/ {icuTotal}</span>
                      </div>

                      {/* 1-Click Adjusters */}
                      <div className="mt-2.5 flex items-center space-x-1.5">
                        <button
                          disabled={isUpdating || icuAvail <= 0}
                          onClick={() => handleBedChange(hosp.id, 'icu', -1)}
                          className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center disabled:opacity-40"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleBedChange(hosp.id, 'icu', 1)}
                          className="flex-1 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* ER Box */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Available ER</span>
                        <Bed className="w-3.5 h-3.5 text-cyan-600" />
                      </div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-black text-cyan-700">{erAvail}</span>
                        <span className="text-xs text-slate-400 font-bold">/ {erTotal}</span>
                      </div>

                      {/* 1-Click Adjusters */}
                      <div className="mt-2.5 flex items-center space-x-1.5">
                        <button
                          disabled={isUpdating || erAvail <= 0}
                          onClick={() => handleBedChange(hosp.id, 'er', -1)}
                          className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center disabled:opacity-40"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleBedChange(hosp.id, 'er', 1)}
                          className="flex-1 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-xs font-bold transition flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  {hosp.specialties && hosp.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hosp.specialties.map((spec, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: DISPATCH STATIONS (Connected to GET /api/admin/stations) */}
      {activeTab === 'stations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Ambulance Dispatch Stations</h3>
              <p className="text-xs text-slate-500">Strategic emergency hubs across metropolitan corridors</p>
            </div>
            <button
              onClick={() => navigate('/stations')}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
            >
              View Stations ➔
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stations.map((stn) => (
              <div
                key={stn.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{stn.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      ID: {stn.id}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nearest Junction:</span>
                    <span className="font-bold text-slate-800">{stn.nearest_node_id || 'N1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Bays:</span>
                    <span className="font-bold text-slate-800">{stn.total_bays || 4} bays</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available Ambulances:</span>
                    <span className="font-extrabold text-emerald-600">{stn.available_ambulances_count || stn.totalAmbulances || 2} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
