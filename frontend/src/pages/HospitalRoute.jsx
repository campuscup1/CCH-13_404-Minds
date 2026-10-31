import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Ambulance,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  GitFork,
  Navigation,
  AlertTriangle,
  Radio
} from 'lucide-react';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import StatusBadge from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { findShortestPathDijkstra } from '../algorithms/dijkstra';
import { findShortestPathAStar } from '../algorithms/astar';
import { findNearestNode } from '../utils/calculations';

export default function HospitalRoute() {
  const { id } = useParams(); // hospitalId or emergencyId
  const navigate = useNavigate();
  const {
    hospitals,
    emergencies,
    ambulances,
    completeActiveJourney,
    blockedEdgeIds,
    trafficMultipliers,
    algorithmPreference
  } = useApp();

  // Find receiving hospital
  const selectedHospital = id
    ? hospitals.find(h => h.id === id) || hospitals[0]
    : hospitals[0];

  // Find transporting emergency
  const activeEmerg = emergencies.find(e => e.status === 'Transporting' || e.status === 'Picked Up') ||
    emergencies.find(e => e.recommendedHospitalId === selectedHospital?.id) ||
    emergencies[0];

  const assignedAmbulance = ambulances.find(a => a.id === activeEmerg?.assignedAmbulanceId) || ambulances[0];

  const [admitted, setAdmitted] = useState(false);

  if (!selectedHospital || !activeEmerg) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">No Active Hospital Route</h3>
        <p className="text-xs text-slate-500 mt-1">Select a receiving hospital first from the recommender.</p>
        <button
          onClick={() => navigate('/hospital-recommendation')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Go to Hospital Recommender
        </button>
      </div>
    );
  }

  // Calculate Stage 2 road route: Patient location -> Hospital
  const pathFinder = algorithmPreference === 'A*' ? findShortestPathAStar : findShortestPathDijkstra;
  const startNode = activeEmerg.nearestNodeId || findNearestNode(activeEmerg.coords).nodeId;
  const targetNode = selectedHospital.nodeId || findNearestNode(selectedHospital.coords).nodeId;

  const routeResult = pathFinder(startNode, targetNode, {
    blockedEdgeIds,
    trafficMultipliers
  });

  const handlePatientAdmitted = async () => {
    setAdmitted(true);
    await completeActiveJourney(activeEmerg.id);
    setTimeout(() => {
      navigate('/analytics');
    }, 700);
  };

  const markers = [
    {
      id: activeEmerg.id,
      title: `Patient Pickup: ${activeEmerg.patientName}`,
      subtitle: `${activeEmerg.locationName} • ${activeEmerg.emergencyType}`,
      coords: activeEmerg.coords,
      type: 'patient'
    },
    {
      id: selectedHospital.id,
      title: `Receiving Hospital: ${selectedHospital.name}`,
      subtitle: `${selectedHospital.address} (${selectedHospital.availableEmergencyBeds} ER / ${selectedHospital.availableIcuBeds} ICU free)`,
      coords: selectedHospital.coords,
      type: 'hospital'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>STAGE 2 OF 2: PATIENT TRANSPORT CORRIDOR</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Patient-to-Hospital Route Prediction
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated secondary leg transporting patient from {activeEmerg.locationName} to receiving facility {selectedHospital.name}.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/dynamic-routing')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Simulate En Route Roadblock</span>
          </button>
        </div>
      </div>

      {/* Main Map + Route Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Map View */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Patient Transport Polyline Route
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              In Transit to Hospital
            </span>
          </div>

          <MapView
            markers={markers}
            routeCoords={routeResult.coords}
            height="440px"
          />

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-[11px]">
                Hospital Trauma Bay Pre-Alerted • Bed Reservation Confirmed
              </span>
            </div>
            <span className="font-bold text-emerald-800 font-mono text-[11px]">
              {algorithmPreference} Engine
            </span>
          </div>
        </div>

        {/* Right Route Panel & Admission Controls */}
        <div className="lg:col-span-5 space-y-6">
          <RoutePanel
            route={routeResult}
            title="Hospital Transfer Trajectory"
            originName={`Pickup: ${activeEmerg.locationName}`}
            destinationName={`Receiving: ${selectedHospital.name}`}
            algorithm={algorithmPreference}
          />

          {/* Hospital Handover & Completion Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              Hospital Arrival & Intake Handover
            </h4>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800">{activeEmerg.patientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Receiving Dept:</span>
                <span className="font-bold text-emerald-700">Emergency & Trauma Ward</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Transport Ambulance:</span>
                <span className="font-bold text-slate-800">{assignedAmbulance.vehicleNumber}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              When the ambulance reaches the receiving hospital emergency bay, click below to log the patient handover and release the ambulance back into service.
            </p>

            <button
              onClick={handlePatientAdmitted}
              disabled={admitted}
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {admitted ? 'Patient Admitted! Concluding Journey...' : 'Confirm Hospital Arrival & Admit Patient'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
