import React, { useState, useEffect } from 'react';
import {
  GitFork,
  AlertOctagon,
  RotateCcw,
  Compass,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Car,
  AlertTriangle,
  RefreshCw,
  Navigation
} from 'lucide-react';
import MapView, { toLatLng } from '../components/MapView';
import { useApp } from '../context/AppContext';
import { simulationApi, publicApi } from '../services/api';

export default function DynamicRouting() {
  const {
    roadGraph,
    activeJourney,
    refreshAllData,
    currentUser
  } = useApp();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedEdge, setSelectedEdge] = useState({ u: 'N7', v: 'N6', name: 'Heart Care Bypass / Tech Link' });
  const [isBlocked, setIsBlocked] = useState(false);
  const [trafficFactor, setTrafficFactor] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [simulationResponse, setSimulationResponse] = useState(null);

  // Load road network from backend
  const loadNetwork = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getMapData();
      if (data) {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      }
    } catch (e) {
      console.warn('Using local graph', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetwork();
  }, []);

  // Quick 1-Click Roadblock Presets on Critical Arterials
  const quickEdgePresets = [
    { u: 'N7', v: 'N6', name: 'East Corridor ➔ Heart Hospital Gate' },
    { u: 'N15', v: 'N8', name: 'Parkway ➔ Trauma Emergency Square' },
    { u: 'N1', v: 'N2', name: 'Central Main Street' },
    { u: 'N3', v: 'N4', name: 'North Ring Expressway' },
    { u: 'N10', v: 'N11', name: 'South Civic Link Avenue' }
  ];

  // Execute Roadblock Simulation via Backend API
  const handleToggleRoadblock = async (blockedStatus) => {
    try {
      setLoading(true);
      const res = await simulationApi.toggleRoadblock(
        selectedEdge.u,
        selectedEdge.v,
        blockedStatus,
        'Tanker collision and emergency road maintenance'
      );
      setIsBlocked(blockedStatus);
      setSimulationResponse(res);
      await loadNetwork();
      await refreshAllData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to simulate roadblock. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Execute Traffic Congestion via Backend API
  const handleSetTraffic = async (factor) => {
    try {
      setLoading(true);
      const res = await simulationApi.updateTraffic(selectedEdge.u, selectedEdge.v, factor);
      setTrafficFactor(factor);
      setSimulationResponse(res);
      await loadNetwork();
      await refreshAllData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update traffic congestion.');
    } finally {
      setLoading(false);
    }
  };

  // Find coordinates of selected edge for visualization
  const uNodeObj = nodes.find(n => n.id === selectedEdge.u);
  const vNodeObj = nodes.find(n => n.id === selectedEdge.v);

  const blockedLine = (isBlocked && uNodeObj && vNodeObj)
    ? [toLatLng(uNodeObj), toLatLng(vNodeObj)]
    : [];

  // Active journey route to display bypass
  const activeRoute = activeJourney?.hospitalRoute || activeJourney?.pickupRoute;
  const activePolyline = (activeRoute?.coordinates || []).map(toLatLng).filter(Boolean);

  const markers = [];
  if (uNodeObj) {
    markers.push({
      id: 'NODE_U',
      title: `Node ${uNodeObj.id}: ${uNodeObj.name}`,
      coords: toLatLng(uNodeObj),
      type: isBlocked ? 'block' : 'station'
    });
  }
  if (vNodeObj) {
    markers.push({
      id: 'NODE_V',
      title: `Node ${vNodeObj.id}: ${vNodeObj.name}`,
      coords: toLatLng(vNodeObj),
      type: isBlocked ? 'block' : 'hospital'
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
              <GitFork className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Dynamic Obstacle & Traffic Simulator
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#102A43] tracking-tight mt-1">
            Real-Time Road Recalculation Engine
          </h1>
          <p className="text-xs text-slate-500">
            Simulate sudden roadblocks or severe congestion. The backend intercepts active routes and triggers instantaneous Bidirectional A* bypass detours.
          </p>
        </div>

        <button
          onClick={loadNetwork}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Graph</span>
        </button>
      </div>

      {/* Control Strip & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Simulation Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Edge Selection Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              1. Select Road Segment to Obstruct
            </h3>

            {/* Quick 1-Click Presets */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Popular Arterials:</p>
              <div className="space-y-1.5">
                {quickEdgePresets.map(preset => (
                  <button
                    key={`${preset.u}-${preset.v}`}
                    onClick={() => {
                      setSelectedEdge(preset);
                      setIsBlocked(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-between ${
                      selectedEdge.u === preset.u && selectedEdge.v === preset.v
                        ? 'bg-blue-50 border-blue-400 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{preset.name}</span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {preset.u} ➔ {preset.v}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Edge Dropdown */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Or Pick from All Network Edges ({edges.length} total):
              </label>
              <select
                value={`${selectedEdge.u}-${selectedEdge.v}`}
                onChange={(e) => {
                  const [u, v] = e.target.value.split('-');
                  const edgeObj = edges.find(ed => (ed.u === u && ed.v === v) || (ed.u === v && ed.v === u));
                  setSelectedEdge({ u, v, name: edgeObj?.road_name || `${u} <-> ${v}` });
                  setIsBlocked(edgeObj?.is_blocked || false);
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
              >
                {edges.map((e, idx) => (
                  <option key={idx} value={`${e.u}-${e.v}`}>
                    {e.road_name} ({e.u} ➔ {e.v}) {e.is_blocked ? '[BLOCKED]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Triggers Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              2. Inject Condition onto {selectedEdge.u} ➔ {selectedEdge.v}
            </h3>

            {/* Roadblock Action */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Road Obstruction Simulation:</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={loading}
                  onClick={() => handleToggleRoadblock(true)}
                  className={`py-3 px-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5 ${
                    isBlocked
                      ? 'bg-red-700 text-white ring-2 ring-red-400'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>Block Road (Cost=∞)</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => handleToggleRoadblock(false)}
                  className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear Obstacle</span>
                </button>
              </div>
            </div>

            {/* Traffic Congestion Multiplier */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block">Traffic Speed Multiplier:</span>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  onClick={() => handleSetTraffic(1.0)}
                  className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition text-center"
                >
                  1.0x (Free)
                </button>
                <button
                  onClick={() => handleSetTraffic(0.5)}
                  className="py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition text-center"
                >
                  0.5x (Moderate)
                </button>
                <button
                  onClick={() => handleSetTraffic(0.2)}
                  className="py-2 px-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 transition text-center"
                >
                  0.2x (Severe Gridlock)
                </button>
              </div>
            </div>

            {/* Feedback Message */}
            {simulationResponse && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs space-y-1">
                <p className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>{simulationResponse.message}</span>
                </p>
                {simulationResponse.rerouted_incidents_count !== undefined && (
                  <p className="text-[11px] text-blue-800 font-semibold">
                    ⚡ {simulationResponse.rerouted_incidents_count} active emergency route(s) automatically detoured!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Map & Real-time Detour Polyline */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Spatial Graph & Reroute Visualization</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              Target Segment: {selectedEdge.u} ➔ {selectedEdge.v}
            </span>
          </div>

          <MapView
            markers={markers}
            routeCoords={activePolyline}
            blockedRouteCoords={blockedLine}
            height="500px"
          />

          <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block shrink-0" />
              <span><strong>Blue Line:</strong> Active Ambulance Route (Bidirectional A*)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block shrink-0" />
              <span><strong>Dashed Red Line:</strong> Blocked road segment (Toggled via Simulator)</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              If an ambulance route crosses the blocked segment, the system dynamically reroutes around the red line and alerts the driver with the revised ETA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
