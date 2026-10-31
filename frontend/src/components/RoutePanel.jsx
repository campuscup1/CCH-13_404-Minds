import React from 'react';
import { Navigation, Clock, Compass, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { formatMinutes } from '../utils/calculations';

export default function RoutePanel({
  route,
  title = 'Route Trajectory Details',
  originName,
  destinationName,
  algorithm = 'Dijkstra',
  isDetour = false
}) {
  if (!route || !route.success) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-center text-slate-500">
        <p className="text-sm font-semibold">No active route calculated</p>
      </div>
    );
  }

  const { totalDistanceKm, totalTimeMinutes, segments = [], pathNodes = [] } = route;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculated via <span className="font-semibold text-blue-600">{algorithm}</span> Algorithm
          </p>
        </div>
        {isDetour && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Rerouted Detour
          </span>
        )}
      </div>

      {/* Origin -> Destination Pill */}
      {(originName || destinationName) && (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <span className="truncate">{originName || 'Origin'}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 mx-2 shrink-0" />
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
            <span className="truncate">{destinationName || 'Destination'}</span>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3">
          <div className="flex items-center space-x-1.5 text-blue-700 text-xs font-medium">
            <Compass className="w-3.5 h-3.5" />
            <span>Total Distance</span>
          </div>
          <p className="text-xl font-extrabold text-blue-900 mt-1">
            {totalDistanceKm} <span className="text-xs font-normal">km</span>
          </p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
          <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Estimated Travel Time</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-900 mt-1">
            {formatMinutes(totalTimeMinutes)}
          </p>
        </div>
      </div>

      {/* Turn-by-Turn Segments */}
      <div>
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Waypoints & Corridors ({segments.length} segments)
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-800">{seg.roadName}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-500">
                <span>{seg.distanceKm} km</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">~{seg.travelTimeMinutes} min</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
