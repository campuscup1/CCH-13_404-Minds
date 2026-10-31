import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Ambulance,
  Sparkles,
  CheckCircle2,
  Clock,
  Compass,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  Award,
  Layers,
  Fuel,
  Info
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { evaluateAmbulanceAssignment } from '../algorithms/ambulanceAssignment';

export default function AmbulanceAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    emergencies,
    ambulances,
    assignAmbulance,
    blockedEdgeIds,
    trafficMultipliers,
    algorithmPreference
  } = useApp();

  // Find target emergency, fallback to first pending or first in list
  const activeEmerg = id
    ? emergencies.find(e => e.id === id)
    : emergencies.find(e => e.status === 'Pending') || emergencies[0];

  const [confirming, setConfirming] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  if (!activeEmerg) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <Ambulance className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">No Emergencies Found</h3>
        <p className="text-xs text-slate-500 mt-1">Submit an emergency request first to dispatch an ambulance.</p>
        <button
          onClick={() => navigate('/emergencies')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Create Emergency
        </button>
      </div>
    );
  }

  // Execute Smart Dispatch Algorithm
  const dispatchEvaluation = evaluateAmbulanceAssignment(activeEmerg, ambulances, {
    blockedEdgeIds,
    trafficMultipliers
  });

  const bestRecommendation = dispatchEvaluation.selectedAmbulance;
  const currentChosenCandidate = selectedCandidateId
    ? dispatchEvaluation.rankedCandidates.find(c => c.ambulance.id === selectedCandidateId) || bestRecommendation
    : bestRecommendation;

  const handleConfirmAssignment = async () => {
    if (!currentChosenCandidate) {
      alert('No eligible ambulance available for dispatch!');
      return;
    }

    setConfirming(true);
    const amb = currentChosenCandidate.ambulance;
    await assignAmbulance(activeEmerg.id, amb.id, currentChosenCandidate.route);

    setTimeout(() => {
      navigate(`/route/ambulance/${amb.id}`);
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>OBJECTIVE 2: SMART DISPATCH ENGINE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Intelligent Ambulance Selection & Dispatch
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Multi-criteria fleet ranking balancing road travel ETA ({algorithmPreference}), medical equipment match, and vehicle readiness.
          </p>
        </div>

        {/* Target Emergency Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Incident:</span>
          <select
            value={activeEmerg.id}
            onChange={(e) => navigate(`/dispatch/${e.target.value}`)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
          >
            {emergencies.map(e => (
              <option key={e.id} value={e.id}>
                {e.id} - {e.patientName} ({e.priority})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Incident Context Card */}
      <div className="bg-[#102A43] text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold bg-blue-500/30 text-blue-300 px-2.5 py-0.5 rounded-md border border-blue-400/40">
                {activeEmerg.id}
              </span>
              <StatusBadge priority={activeEmerg.priority} />
              <StatusBadge status={activeEmerg.status} />
            </div>
            <h3 className="text-xl font-extrabold mt-2 text-white">
              {activeEmerg.patientName} • {activeEmerg.emergencyType}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Location: <span className="text-white font-medium">{activeEmerg.locationName}</span>
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300 max-w-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Required Medical Assistance
            </span>
            <div className="flex flex-wrap gap-1">
              {(activeEmerg.requiredAssistance || []).map((req, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded font-semibold text-[11px] border border-blue-500/40">
                  {req}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Algorithm Dispatch Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Total Fleet Evaluated</span>
            <span className="font-extrabold text-white text-base">{dispatchEvaluation.totalFleetEvaluated} Vehicles</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Eligible Available Units</span>
            <span className="font-extrabold text-emerald-400 text-base">{dispatchEvaluation.eligibleCount} Units</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Fastest Road Response</span>
            <span className="font-extrabold text-blue-400 text-base">
              {bestRecommendation ? `${bestRecommendation.etaMinutes} mins` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Road Network Routing</span>
            <span className="font-extrabold text-amber-400 text-base">{algorithmPreference} Real-time</span>
          </div>
        </div>
      </div>

      {/* Best Recommendation Highlight Banner */}
      {bestRecommendation ? (
        <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent p-6 rounded-3xl border-2 border-emerald-500/50 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                    ALGORITHMIC TOP MATCH
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    Match Score: {bestRecommendation.score} / 100
                  </span>
                </div>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  Ambulance {bestRecommendation.ambulance.id} ({bestRecommendation.ambulance.vehicleNumber})
                </h4>
                <p className="text-xs text-slate-600">
                  {bestRecommendation.ambulance.type} • Base: {bestRecommendation.ambulance.stationName}
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirmAssignment}
              disabled={confirming}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 self-start sm:self-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{confirming ? 'Authorizing Dispatch...' : 'Confirm Dispatch Assignment'}</span>
            </button>
          </div>

          {/* Transparent Scoring Rationale */}
          <div className="p-4 bg-white/80 rounded-2xl border border-emerald-200 text-xs space-y-2">
            <p className="font-bold text-slate-800 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Why Was This Ambulance Selected?</span>
            </p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {bestRecommendation.recommendationReason}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold">1. Travel-Time Score (50% wt)</span>
                <span className="font-bold text-blue-700">
                  ETA: {bestRecommendation.etaMinutes} mins ({bestRecommendation.distanceKm} km)
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold">2. Medical Equipment (35% wt)</span>
                <span className="font-bold text-emerald-700">
                  {bestRecommendation.equipmentMatchPct}% Clinical Gear Match
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold">3. Vehicle Telemetry (15% wt)</span>
                <span className="font-bold text-slate-700">
                  Fuel {bestRecommendation.ambulance.fuelLevel} • Driver {bestRecommendation.ambulance.driverExperience} exp
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">No Available Ambulance Found in Solapur Network</p>
            <p className="text-red-700 mt-0.5">
              All ambulances are currently busy, assigned, or out of service. Release fleet units in Ambulance Fleet Management or wait for trip completions.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Table of All Candidates */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">All Candidate Fleet Evaluation Comparison</h3>
            <p className="text-xs text-slate-500">
              Transparent multi-criteria evaluation of all ambulances in the Solapur EMS network
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {dispatchEvaluation.allCandidates.length} Fleet Units
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#102A43]/5 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/70">
              <tr>
                <th className="py-3 px-4">Ambulance</th>
                <th className="py-3 px-4">Base Station</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Road Distance</th>
                <th className="py-3 px-4">Estimated ETA</th>
                <th className="py-3 px-4">Gear Match</th>
                <th className="py-3 px-4">Selection Score</th>
                <th className="py-3 px-4 text-right">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatchEvaluation.allCandidates.map(cand => {
                const amb = cand.ambulance;
                const isSelected = (selectedCandidateId || bestRecommendation?.ambulance?.id) === amb.id;
                const isTopPick = bestRecommendation?.ambulance?.id === amb.id;

                return (
                  <tr
                    key={amb.id}
                    className={`transition ${
                      !cand.isEligible ? 'opacity-50 bg-slate-50/50' : isSelected ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        {isTopPick && (
                          <Award className="w-4 h-4 text-emerald-600 shrink-0" title="Top Algorithmic Pick" />
                        )}
                        <div>
                          <p className="font-extrabold text-slate-900">{amb.id}</p>
                          <p className="text-[11px] font-mono text-slate-500">{amb.vehicleNumber}</p>
                          <span className="text-[10px] text-blue-600">{amb.type}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">{amb.stationName}</td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={amb.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {cand.distanceKm != null ? `${cand.distanceKm} km` : '--'}
                    </td>

                    <td className="py-3.5 px-4">
                      {cand.etaMinutes != null ? (
                        <span className="font-extrabold text-blue-700">{cand.etaMinutes} mins</span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          cand.equipmentMatchPct === 100
                            ? 'text-emerald-700'
                            : cand.equipmentMatchPct >= 50
                            ? 'text-amber-700'
                            : 'text-red-600'
                        }`}
                      >
                        {cand.equipmentMatchPct}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {cand.isEligible ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900">{cand.score}</span>
                          <span className="text-[10px] text-slate-400">/ 100</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-red-500 font-semibold truncate max-w-[150px] block" title={cand.disqualificationReason}>
                          Disqualified: {cand.disqualificationReason}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {cand.isEligible ? (
                        <button
                          onClick={() => setSelectedCandidateId(amb.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Pick Unit'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Unavailable</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
