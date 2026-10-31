import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  Edit3,
  Sparkles,
  UserCheck
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { classifyEmergencyPriority } from '../algorithms/emergencyPriority';

export default function EmergencyAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { emergencies, updateEmergency } = useApp();

  // Find target emergency, fallback to first pending or first emergency
  const activeEmerg = id
    ? emergencies.find(e => e.id === id)
    : emergencies.find(e => e.status === 'Pending') || emergencies[0];

  const [currentPriority, setCurrentPriority] = useState(activeEmerg?.priority || 'Critical');
  const [overrideReason, setOverrideReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (activeEmerg) {
      setCurrentPriority(activeEmerg.priority);
      setOverrideReason('');
      setIsEditing(false);
    }
  }, [activeEmerg?.id]);

  if (!activeEmerg) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">No Emergencies Found</h3>
        <p className="text-xs text-slate-500 mt-1">Submit an emergency request first to assess priority.</p>
        <button
          onClick={() => navigate('/emergencies')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Create Emergency
        </button>
      </div>
    );
  }

  // Re-run the rule classification dynamically to show the exact algorithmic rule matches
  const assessment = classifyEmergencyPriority(activeEmerg);

  const handleSaveOverride = async () => {
    await updateEmergency(activeEmerg.id, {
      priority: currentPriority,
      priorityReason: overrideReason
        ? `Manual Override by Dispatcher: ${overrideReason}`
        : activeEmerg.priorityReason
    });
    setSavedSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            <Activity className="w-4 h-4" />
            <span>OBJECTIVE 1: ALGORITHMIC TRIAGE ENGINE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Emergency Priority Assessment
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic rule-based triage score calculating dispatch urgency for incident {activeEmerg.id}.
          </p>
        </div>

        {/* Emergency Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Incident:</span>
          <select
            value={activeEmerg.id}
            onChange={(e) => navigate(`/assessment/${e.target.value}`)}
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

      {/* Evaluation Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Algorithmic Resource Prioritization Disclaimer:</p>
          <p className="text-amber-800 text-[11px] mt-0.5">
            This system evaluates explicitly reported emergency categories and caller-reported symptoms to allocate EMS fleet resources. It does not replace medical clinical triage. Authorized dispatchers may review and override priority below.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Priority review updated successfully!</span>
        </div>
      )}

      {/* Main Assessment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Patient Case Profile */}
        <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Case Incident Profile
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
              <span className="font-bold text-slate-800 text-sm">{activeEmerg.patientName}</span>
              <span className="text-slate-500 ml-2">({activeEmerg.patientAge} yrs, {activeEmerg.patientGender})</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Category</span>
              <span className="font-bold text-blue-700 text-sm">{activeEmerg.emergencyType}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Reported Symptoms</span>
              <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed mt-1">
                {activeEmerg.description}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
              <span className="font-semibold text-slate-800">{activeEmerg.locationName}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                Requested Medical Equipment
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(activeEmerg.requiredAssistance || []).map((req, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold text-[11px] border border-blue-200">
                    {req}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Algorithmic Rule Evaluation & Override */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rule-Based Classification Breakdown
              </h3>
              <p className="text-xs text-slate-500">Evaluated score: {assessment.score} / 100</p>
            </div>
            <StatusBadge priority={currentPriority} className="text-xs px-3 py-1" />
          </div>

          {/* Transparent Matched Rules List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              Triggered Triage Rules ({assessment.matchedRules.length})
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {assessment.matchedRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">{rule.rule}</p>
                    <p className="text-[11px] text-slate-600">{rule.description}</p>
                  </div>
                  <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 text-[11px] shrink-0 ml-2">
                    {rule.weight}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Callout */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-1">
            <p className="font-bold text-blue-900 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Algorithmic Recommendation Summary</span>
            </p>
            <p className="text-blue-800 leading-relaxed text-[11px]">{assessment.explanation}</p>
          </div>

          {/* Dispatcher Override Controls */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span>Dispatcher Review & Override</span>
              </span>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modify Priority</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>

            {isEditing && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select New Priority Tier
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Critical', 'High', 'Medium', 'Normal'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPriority(p)}
                        className={`py-2 text-xs font-bold rounded-xl border transition ${
                          currentPriority === p
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supervisor Override Reason (Audited)
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Caller reported deteriorating consciousness on callback..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleSaveOverride}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  Save Priority Override
                </button>
              </div>
            )}
          </div>

          {/* Action to proceed to dispatch */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              onClick={() => navigate('/emergencies')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back to Requests
            </button>
            <button
              onClick={() => navigate(`/dispatch/${activeEmerg.id}`)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/30 transition flex items-center space-x-2"
            >
              <span>Proceed to Smart Ambulance Dispatch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
