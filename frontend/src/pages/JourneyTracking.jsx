import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Clock,
  Compass,
  Ambulance,
  Building2,
  User,
  HeartPulse,
  Activity,
  AlertTriangle,
  Info,
  ShieldCheck,
  MapPin,
  RefreshCw
} from 'lucide-react';
import MapView, { toLatLng } from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { emergencyApi, driverApi } from '../services/api';

export default function JourneyTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    emergencies,
    ambulances,
    hospitals,
    activeJourney,
    currentUser,
    refreshAllData
  } = useApp();

  const [backendIncident, setBackendIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [driverActionLoading, setDriverActionLoading] = useState(false);

  // 1. Fetch live emergency incident from backend API
  const targetId = id || activeJourney?.emergencyId || (emergencies.length > 0 ? emergencies[0].id : null);

  const fetchLiveIncident = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      const data = await emergencyApi.getById(targetId);
      if (data) {
        setBackendIncident(data);
      }
    } catch (e) {
      console.warn('Could not fetch incident from backend, using context fallback', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveIncident();
    const interval = setInterval(fetchLiveIncident, 5000);
    return () => clearInterval(interval);
  }, [targetId]);

  // Merge backend incident data with context entities
  const emergency = backendIncident || emergencies.find(e => e.id === targetId) || emergencies[0];

  const assignedAmbId = emergency?.assigned_ambulance_id || emergency?.assignedAmbulanceId;
  const ambulance = ambulances.find(a => a.id === assignedAmbId) || ambulances[0];

  const destHospId = emergency?.destination_hospital_id || emergency?.recommendedHospitalId;
  const hospital = hospitals.find(h => h.id === destHospId) || (hospitals.length > 0 ? hospitals[0] : null);

  // Two-Stage Journey Logic
  // Stage 1: STAGE_1_DISPATCH_TO_PATIENT (Station -> Patient)
  // Stage 2: STAGE_2_PATIENT_TO_HOSPITAL (Patient -> Hospital)
  const isStage2 = emergency?.journey_stage === 'STAGE_2_PATIENT_TO_HOSPITAL' || emergency?.stage2_route !== null;
  const isCompleted = emergency?.journey_stage === 'COMPLETED';

  // Active route from backend Bidirectional A* calculation
  const activeRoute = isStage2 && emergency?.stage2_route
    ? emergency.stage2_route
    : emergency?.stage1_route;

  const rawRouteCoords = activeRoute?.coordinates || [];
  const routePolyline = rawRouteCoords.map(toLatLng).filter(Boolean);

  // Markers
  const markers = [];

  // Ambulance Marker
  if (ambulance) {
    const ambPos = [
      emergency?.pickup_coordinate?.lat || ambulance.coords?.[0] || 12.9352,
      emergency?.pickup_coordinate?.lon || ambulance.coords?.[1] || 77.6145
    ];
    markers.push({
      id: 'AMB_ACTIVE',
      title: `Ambulance ${ambulance.vehicle_number || ambulance.vehicleNumber || ambulance.id}`,
      subtitle: `Status: ${ambulance.status} • Type: ${ambulance.vehicle_type || ambulance.type}`,
      coords: ambPos,
      type: 'ambulance'
    });
  }

  // Patient Marker
  if (emergency?.pickup_coordinate || emergency?.coords) {
    const pLat = emergency.pickup_coordinate ? emergency.pickup_coordinate.lat : emergency.coords[0];
    const pLon = emergency.pickup_coordinate ? emergency.pickup_coordinate.lon : emergency.coords[1];
    markers.push({
      id: 'PATIENT_ACTIVE',
      title: `Patient: ${emergency.patient_name || emergency.patientName || 'Emergency Scene'}`,
      subtitle: `${emergency.pickup_address || emergency.locationName || 'Scene Location'}`,
      coords: [pLat, pLon],
      type: 'patient'
    });
  }

  // Hospital Marker (If Stage 2 or destination assigned)
  if (hospital) {
    const hLat = hospital.coordinate ? hospital.coordinate.lat : hospital.coords?.[0];
    const hLon = hospital.coordinate ? hospital.coordinate.lon : hospital.coords?.[1];
    if (hLat && hLon) {
      markers.push({
        id: 'HOSP_ACTIVE',
        title: `Hospital: ${hospital.name}`,
        subtitle: `${hospital.available_icu_beds ?? hospital.availableIcuBeds} ICU / ${hospital.available_er_beds ?? hospital.availableEmergencyBeds} ER beds ready`,
        coords: [hLat, hLon],
        type: 'hospital'
      });
    }
  }

  // Driver action triggers
  const handleDriverStatusUpdate = async (newStatus) => {
    try {
      setDriverActionLoading(true);
      await driverApi.updateStatus(newStatus);
      await fetchLiveIncident();
      await refreshAllData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update driver status. Ensure you are logged in as a driver.');
    } finally {
      setDriverActionLoading(false);
    }
  };

  const isRerouted = activeRoute?.is_rerouted;
  const detourReason = activeRoute?.reroute_reason;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Live Mission Telemetry
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
              {emergency?.id || 'NO ACTIVE CALL'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#102A43] tracking-tight mt-1">
            Two-Stage Emergency Journey Tracking
          </h1>
          <p className="text-xs text-slate-500">
            Real-time ambulance dispatch to scene & hospital transfer monitoring
          </p>
        </div>

        <button
          onClick={fetchLiveIncident}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Backend</span>
        </button>
      </div>

      {/* Dynamic Roadblock / Detour Alert Banner */}
      {isRerouted && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs flex items-start space-x-3 shadow-md">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-amber-900 text-sm">
              DYNAMIC DETOUR ACTIVATED: Road Recalculation Triggered!
            </p>
            <p className="text-amber-800 leading-relaxed font-medium">
              {detourReason || 'Obstacle or congestion detected on initial path. The system dynamically bypassed the obstruction using Bidirectional A*.'}
            </p>
            <p className="text-[11px] font-mono text-amber-900">
              Revised Path Nodes: {activeRoute?.path_nodes?.join(' ➔ ') || 'Detour computed'}
            </p>
          </div>
        </div>
      )}

      {/* Two-Stage Journey Visual Progress Indicator */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Lifecycle Stage Progression
          </span>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {emergency?.journey_stage || 'STAGE_1_DISPATCH_TO_PATIENT'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stage 1 Block */}
          <div className={`p-4 rounded-2xl border transition ${
            !isStage2 && !isCompleted
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-emerald-50/50 border-emerald-200 opacity-90'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-blue-900 flex items-center space-x-1.5">
                <Ambulance className="w-4 h-4 text-blue-600" />
                <span>Stage 1: Station ➔ Emergency Scene</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                !isStage2 && !isCompleted ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {!isStage2 && !isCompleted ? 'ACTIVE STAGE' : 'PICKUP REACHED'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Dispatched unit navigates to patient coordinates with optimal ERT.
            </p>
            {emergency?.stage1_route && (
              <div className="mt-2 text-[11px] font-semibold text-slate-700 flex space-x-3">
                <span>Dist: {emergency.stage1_route.total_distance_km} km</span>
                <span>•</span>
                <span>ETA: {emergency.stage1_route.total_duration_minutes} min</span>
              </div>
            )}
          </div>

          {/* Stage 2 Block */}
          <div className={`p-4 rounded-2xl border transition ${
            isStage2 && !isCompleted
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
              : isCompleted
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-slate-800 flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Stage 2: Patient ➔ Destination Hospital</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isStage2 && !isCompleted
                  ? 'bg-blue-600 text-white'
                  : isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {isStage2 && !isCompleted ? 'ACTIVE STAGE' : isCompleted ? 'ADMITTED' : 'PENDING PICKUP'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Evaluates specialty matching, ICU bed availability, and transit time.
            </p>
            {emergency?.stage2_route && (
              <div className="mt-2 text-[11px] font-semibold text-slate-700 flex space-x-3">
                <span>Hospital: {hospital?.name || emergency.destination_hospital_id}</span>
                <span>•</span>
                <span>ETA: {emergency.stage2_route.total_duration_minutes} min</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Map & Live Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Map */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>
                {isStage2 ? 'Stage 2 Navigation (Patient ➔ Hospital)' : 'Stage 1 Navigation (Depot ➔ Patient)'}
              </span>
            </h3>
            <span className="text-xs font-bold text-blue-600">
              Live Route Navigation
            </span>
          </div>

          <MapView
            markers={markers}
            routeCoords={routePolyline}
            height="440px"
          />

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Road Nodes</span>
              <span className="font-extrabold text-slate-800 text-xs truncate block">
                {activeRoute?.path_nodes ? activeRoute.path_nodes.join(' ➔ ') : 'Calculating...'}
              </span>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <span className="text-blue-700 text-[10px] uppercase font-bold block">Distance</span>
              <span className="font-extrabold text-blue-900 text-sm">
                {activeRoute?.total_distance_km ? `${activeRoute.total_distance_km} km` : '--'}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <span className="text-emerald-700 text-[10px] uppercase font-bold block">Estimated Time</span>
              <span className="font-extrabold text-emerald-900 text-sm">
                {activeRoute?.total_duration_minutes ? `${activeRoute.total_duration_minutes} mins` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Driver Controls & Recommendations */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mission Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Incident Overview</span>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {emergency?.category || emergency?.emergencyType || 'EMERGENCY'}
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient</span>
                <p className="font-bold text-slate-800 text-sm">
                  {emergency?.patient_name || emergency?.patientName}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {emergency?.description || 'Emergency incident recorded.'}
                </p>
                <p className="text-slate-600 font-medium text-[11px] mt-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emergency?.pickup_address || emergency?.locationName}</span>
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-blue-600 text-[10px] uppercase font-bold block">Assigned Ambulance</span>
                  <p className="font-bold text-blue-950 text-sm">
                    {ambulance?.vehicle_number || ambulance?.vehicleNumber || ambulance?.id}
                  </p>
                  <p className="text-blue-700 text-[11px]">
                    Type: {ambulance?.vehicle_type || ambulance?.type} (Equipped for {emergency?.category})
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs">
                  {ambulance?.status || 'ASSIGNED'}
                </span>
              </div>
            </div>

            {/* DRIVER ROLE CONTROLS */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  Driver Controls (Role: {currentUser?.role || 'Guest'})
                </span>
                {currentUser?.role !== 'DRIVER' && (
                  <span className="text-[10px] text-amber-600 font-semibold">
                    (Login as driver to execute)
                  </span>
                )}
              </div>

              {!isStage2 && !isCompleted && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={driverActionLoading}
                    onClick={() => handleDriverStatusUpdate('ARRIVED_AT_SCENE')}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition"
                  >
                    1. Arrived at Scene
                  </button>
                  <button
                    disabled={driverActionLoading}
                    onClick={() => handleDriverStatusUpdate('PICKUP_CONFIRMED')}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                  >
                    2. Confirm Pickup ➔
                  </button>
                </div>
              )}

              {isStage2 && !isCompleted && (
                <button
                  disabled={driverActionLoading}
                  onClick={() => handleDriverStatusUpdate('ARRIVED_AT_HOSPITAL')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Arrived at Hospital & Admit Patient</span>
                </button>
              )}

              {isCompleted && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-center text-xs">
                  Journey Completed! Patient admitted & ambulance released.
                </div>
              )}
            </div>
          </div>

          {/* Hospital Recommendation Breakdown (When Stage 2 reached) */}
          {emergency?.hospital_recommendations && emergency.hospital_recommendations.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Hospital Recommendation Engine</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Multi-Criteria Decision
                </span>
              </h4>

              <div className="space-y-2.5">
                {emergency.hospital_recommendations.slice(0, 3).map((rec, idx) => {
                  const isTop = idx === 0;
                  return (
                    <div
                      key={rec.hospital.id}
                      className={`p-3 rounded-2xl border text-xs transition ${
                        isTop
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900 flex items-center space-x-1.5">
                          {isTop && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                          <span>{rec.hospital.name}</span>
                        </span>
                        <span className={isTop ? 'text-emerald-700 font-extrabold' : 'text-slate-600'}>
                          Score: {rec.composite_score}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{rec.reason}</p>
                      <div className="flex items-center space-x-4 text-[10px] text-slate-600 font-semibold mt-1.5">
                        <span>ICU: {rec.hospital.available_icu_beds} open</span>
                        <span>•</span>
                        <span>ER: {rec.hospital.available_er_beds} open</span>
                        <span>•</span>
                        <span>ETA: {rec.eta_minutes} mins</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
