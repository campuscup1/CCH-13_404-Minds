import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Bed,
  Info
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { evaluateHospitalRecommendation } from '../algorithms/hospitalRecommendation';

export default function HospitalRecommendation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    emergencies,
    hospitals,
    assignHospital,
    blockedEdgeIds,
    trafficMultipliers,
    algorithmPreference
  } = useApp();

  const activeEmerg = id
    ? emergencies.find(e => e.id === id)
    : emergencies.find(e => e.status === 'Picked Up' || e.status === 'Assigned') || emergencies[0];

  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [confirming, setConfirming] = useState(false);

  if (!activeEmerg) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">No Active Emergency Found</h3>
        <p className="text-xs text-slate-500 mt-1">Select an emergency from the command center.</p>
        <button
          onClick={() => navigate('/emergencies')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Go to Emergency Requests
        </button>
      </div>
    );
  }

  // Execute Intelligent Hospital Recommendation
  const recommendation = evaluateHospitalRecommendation(activeEmerg, hospitals, {
    blockedEdgeIds,
    trafficMultipliers
  });

  const bestHospitalMatch = recommendation.bestHospital;
  const currentChosen = selectedHospitalId
    ? recommendation.topRecommendations.find(h => h.hospital.id === selectedHospitalId) || bestHospitalMatch
    : bestHospitalMatch;

  const handleConfirmHospital = async () => {
    if (!currentChosen) {
      alert('No eligible receiving hospital available!');
      return;
    }

    setConfirming(true);
    const hosp = currentChosen.hospital;
    await assignHospital(activeEmerg.id, hosp.id, currentChosen.route);

    setTimeout(() => {
      navigate(`/route/hospital/${hosp.id}`);
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>OBJECTIVE 4: FACILITY-MATCHED INTAKE ENGINE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Intelligent Hospital Recommendation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Capacity-aware matching combining clinical department requirements, real-time ICU/ER bed availability, and road travel time.
          </p>
        </div>

        {/* Incident Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Incident:</span>
          <select
            value={activeEmerg.id}
            onChange={(e) => navigate(`/hospital-recommendation/${e.target.value}`)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
          >
            {emergencies.map(e => (
              <option key={e.id} value={e.id}>
                {e.id} - {e.patientName} ({e.emergencyType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Emergency Context Banner */}
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
              Patient: {activeEmerg.patientName} • {activeEmerg.emergencyType}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Pickup Point: <span className="text-white font-medium">{activeEmerg.locationName}</span>
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300 max-w-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Required Hospital Specialties
            </span>
            <div className="flex flex-wrap gap-1">
              {recommendation.requiredSpecialties.map((spec, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded font-semibold text-[11px] border border-blue-500/40">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Formula Display */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-amber-400">Scoring Function:</span>
            <span className="font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px]">
              Score = 40% Facility Match + 30% Bed Capacity + 30% Travel Time
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Road Metric: {algorithmPreference} Algorithmic Shortest Path
          </span>
        </div>
      </div>

      {/* Top Best Recommendation Highlight Card */}
      {bestHospitalMatch ? (
        <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent p-6 rounded-3xl border-2 border-emerald-500/50 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                    RECOMMENDED RECEIVING HOSPITAL
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    Weighted Score: {bestHospitalMatch.score} / 100
                  </span>
                </div>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  {bestHospitalMatch.hospital.name}
                </h4>
                <p className="text-xs text-slate-600">
                  {bestHospitalMatch.hospital.traumaLevel} • {bestHospitalMatch.hospital.address}
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirmHospital}
              disabled={confirming}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 self-start sm:self-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{confirming ? 'Alerting Emergency Trauma Team...' : 'Authorize Hospital Destination'}</span>
            </button>
          </div>

          {/* Rationale and Breakdown */}
          <div className="p-4 bg-white/80 rounded-2xl border border-emerald-200 text-xs space-y-2">
            <p className="font-bold text-slate-800 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Algorithmic Selection Justification</span>
            </p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {bestHospitalMatch.recommendationReason}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold">1. Facility Match (40%)</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {bestHospitalMatch.facilityScore} / 100
                </span>
                <span className="text-slate-500 block text-[10px]">All required clinical units available</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold">2. Bed Capacity (30%)</span>
                <span className="font-bold text-blue-700 text-sm">
                  {bestHospitalMatch.capacityScore} / 100
                </span>
                <span className="text-slate-500 block text-[10px]">
                  {bestHospitalMatch.hospital.availableEmergencyBeds} ER • {bestHospitalMatch.hospital.availableIcuBeds} ICU free
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold">3. Travel Time Score (30%)</span>
                <span className="font-bold text-indigo-700 text-sm">
                  {bestHospitalMatch.travelTimeScore} / 100
                </span>
                <span className="text-slate-500 block text-[10px]">
                  ETA {bestHospitalMatch.etaMinutes} mins ({bestHospitalMatch.distanceKm} km)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">No Eligible Hospital Found</p>
            <p className="text-red-700 mt-0.5">
              Network hospitals currently lack required specialty services or have zero available ICU/ER beds.
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Comparison Cards Grid */}
      <div>
        <h3 className="text-base font-bold text-[#102A43] tracking-tight mb-4">
          Top 3 Suitable Receiving Hospitals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendation.topRecommendations.map((cand, idx) => {
            const h = cand.hospital;
            const isTop = idx === 0;
            const isSelected = (selectedHospitalId || bestHospitalMatch?.hospital?.id) === h.id;

            return (
              <div
                key={h.id}
                className={`bg-white rounded-3xl p-6 border transition space-y-4 flex flex-col justify-between ${
                  isSelected ? 'border-2 border-blue-600 shadow-md ring-2 ring-blue-500/10' : 'border-slate-200/80 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Rank #{idx + 1}
                    </span>
                    <span className="font-extrabold text-sm text-slate-800">
                      {cand.score} <span className="text-xs text-slate-400 font-normal">pts</span>
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-base mt-2">{h.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{h.traumaLevel}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Road ETA</span>
                      <span className="font-extrabold text-blue-700 text-base">{cand.etaMinutes} mins</span>
                      <span className="text-slate-500 text-[10px] block">{cand.distanceKm} km</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Avail Beds</span>
                      <span className="font-extrabold text-emerald-700 text-base">{h.availableEmergencyBeds} ER</span>
                      <span className="text-blue-700 font-bold text-[10px] block">{h.availableIcuBeds} ICU</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Matched Services
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(cand.matchedServices || []).map((srv, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedHospitalId(h.id)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected ? 'Destination Selected' : 'Choose This Hospital'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
