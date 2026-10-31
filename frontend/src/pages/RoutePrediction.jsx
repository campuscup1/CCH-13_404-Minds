import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Ambulance,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  GitFork,
  HeartPulse,
  Navigation,
  AlertCircle
} from 'lucide-react';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import StatusBadge from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { findShortestPathDijkstra } from '../algorithms/dijkstra';
import { findShortestPathAStar } from '../algorithms/astar';
import { findNearestNode } from '../utils/calculations';

export default function RoutePrediction() {
  const { id } = useParams(); // ambulanceId or emergencyId
  const navigate = useNavigate();
  const {
    ambulances,
    emergencies,
    confirmPatientPickup,
    blockedEdgeIds,
    trafficMultipliers,
    algorithmPreference
  } = useApp();

  // Find ambulance
  const selectedAmb = id
    ? ambulances.find(a => a.id === id) || ambulances.find(a => a.status === 'Assigned' || a.status === 'On the way') || ambulances[0]
    : ambulances.find(a => a.status === 'Assigned' || a.status === 'On the way') || ambulances[0];

  // Find corresponding emergency
  const linkedEmergency = emergencies.find(e => e.assignedAmbulanceId === selectedAmb?.id) ||
    emergencies.find(e => e.status === 'Assigned' || e.status === 'Pending') ||
    emergencies[0];

  const [pickupConfirmed, setPickupConfirmed] = useState(false);

  if (!selectedAmb || !linkedEmergency) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">No Active Ambulance Route</h3>
        <p className="text-xs text-slate-500 mt-1">Assign an ambulance from the Smart Dispatch console first.</p>
        <button
          onClick={() => navigate('/dispatch')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Go to Dispatch
        </button>
      </div>
    );
  }

  // Calculate actual road route using chosen algorithm
  const pathFinder = algorithmPreference === 'A*' ? findShortestPathAStar : findShortestPathDijkstra;
  const startNode = selectedAmb.currentNodeId || 'N_CIVIL';
  const targetNode = linkedEmergency.nearestNodeId || findNearestNode(linkedEmergency.coords).nodeId;

  const routeResult = pathFinder(startNode, targetNode, {
    blockedEdgeIds,
    trafficMultipliers
  });

  const handleConfirmPickup = async () => {
    setPickupConfirmed(true);
    await confirmPatientPickup(linkedEmergency.id);
    setTimeout(() => {
      navigate(`/hospital-recommendation/${linkedEmergency.id}`);
    }, 600);
  };

  const markers = [
    {
      id: selectedAmb.id,
      title: `Ambulance ${selectedAmb.id} (Start)`,
      subtitle: `${selectedAmb.locationName}`,
      coords: selectedAmb.coords,
      type: 'ambulance'
    },
    {
      id: linkedEmergency.id,
      title: `Patient Pickup (${linkedEmergency.patientName})`,
      subtitle: `${linkedEmergency.locationName} • ${linkedEmergency.emergencyType}`,
      coords: linkedEmergency.coords,
      type: 'patient'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            <Compass className="w-4 h-4" />
            <span>STAGE 1 OF 2: INGRESS DISPATCH CORRIDOR</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Ambulance-to-Patient Route Prediction
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic road-network traversal from {selectedAmb.locationName} to patient location at {linkedEmergency.locationName}.
          </p>
        </div>

        {/* Quick Simulator Link */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/dynamic-routing')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Simulate Roadblocks</span>
          </button>
        </div>
      </div>

      {/* Primary Visual Map + Route Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Map View */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Solapur Road Network Polyline Trajectory
              </h3>
            </div>
            <StatusBadge status={selectedAmb.status} />
          </div>

          <MapView
            markers={markers}
            routeCoords={routeResult.coords}
            height="440px"
          />

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium text-[11px]">
                Navigating via verified road network segments (not straight-line interpolation)
              </span>
            </div>
            <span className="font-bold text-blue-700 font-mono text-[11px]">
              {algorithmPreference} Engine
            </span>
          </div>
        </div>

        {/* Right Route Panel & Ingress Actions */}
        <div className="lg:col-span-5 space-y-6">
          <RoutePanel
            route={routeResult}
            title="Ambulance Ingress Trajectory"
            originName={`Depot: ${selectedAmb.locationName}`}
            destinationName={`Scene: ${linkedEmergency.locationName}`}
            algorithm={algorithmPreference}
          />

          {/* Patient Pickup Confirmation Callout */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              Paramedic Field Actions
            </h4>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800">{linkedEmergency.patientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Emergency:</span>
                <span className="font-bold text-blue-700">{linkedEmergency.emergencyType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Priority Tier:</span>
                <StatusBadge priority={linkedEmergency.priority} />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upon reaching the scene, stabilize the patient, load onboard the ambulance, and confirm pickup to launch real-time hospital recommendation.
            </p>

            <button
              onClick={handleConfirmPickup}
              disabled={pickupConfirmed}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {pickupConfirmed ? 'Pickup Confirmed! Loading Recommender...' : 'Confirm Patient Pickup & Find Hospital'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
