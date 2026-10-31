import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  MapPin,
  Compass,
  Phone,
  User,
  Activity,
  HeartPulse,
  Crosshair,
  CheckCircle2,
  RotateCcw,
  PlusCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import MapView from '../components/MapView';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { validateEmergencyForm } from '../utils/validators';
import { ROAD_NODES } from '../data/roadNetwork';
import { findNearestNode } from '../utils/calculations';

const INITIAL_FORM = {
  caller_name: 'Caller / Bystander',
  patientName: 'Suresh Kumar',
  patientAge: '52',
  patientGender: 'Male',
  contactNumber: '+91-9876543210',
  emergencyContact: '+91-9876501234',
  emergencyType: 'CARDIAC',
  severity: 'CRITICAL',
  description: 'Sudden chest discomfort, acute arrhythmia, loss of consciousness',
  locationName: 'East Tech Corridor, Gate 2',
  latitude: 12.9350,
  longitude: 77.6380,
  requiredAssistance: ['Oxygen', 'ALS Defibrillator']
};

export default function EmergencyRequests() {
  const navigate = useNavigate();
  const { emergencies, addEmergency } = useApp();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  // Quick Metropolitan Landmark Presets (Matching Backend Road Network)
  const quickLandmarks = [
    { name: 'East Tech Corridor (N7)', coords: [12.9350, 77.6380], nodeId: 'N7' },
    { name: 'Apex Heart Hospital Gate (N6)', coords: [12.9430, 77.6360], nodeId: 'N6' },
    { name: 'City Memorial Square (N8)', coords: [12.9280, 77.6350], nodeId: 'N8' },
    { name: 'North Ring Expressway (N3)', coords: [12.9460, 77.6155], nodeId: 'N3' },
    { name: 'Rainbow Child Clinic Plaza (N12)', coords: [12.9320, 77.6000], nodeId: 'N12' },
    { name: 'Midtown Crossing (N17)', coords: [12.9300, 77.6180], nodeId: 'N17' }
  ];

  const handleLandmarkSelect = (landmark) => {
    setForm(prev => ({
      ...prev,
      locationName: landmark.name,
      latitude: landmark.coords[0],
      longitude: landmark.coords[1]
    }));
  };

  const handleMapClick = (latlng) => {
    const nearest = findNearestNode(latlng);
    setForm(prev => ({
      ...prev,
      latitude: Math.round(latlng[0] * 10000) / 10000,
      longitude: Math.round(latlng[1] * 10000) / 10000,
      locationName: prev.locationName || `Near ${nearest.node.name}`
    }));
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        setForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          locationName: 'Detected Current Location (Browser GPS)'
        }));
      },
      () => {
        setGeoLoading(false);
        // Fallback to Solapur Center
        setForm(prev => ({
          ...prev,
          latitude: 17.6650,
          longitude: 75.9080,
          locationName: 'Saat Rasta Central (Simulated Fallback)'
        }));
      },
      { timeout: 7000 }
    );
  };

  const toggleAssistance = (item) => {
    setForm(prev => {
      const exists = prev.requiredAssistance.includes(item);
      const updated = exists
        ? prev.requiredAssistance.filter(a => a !== item)
        : [...prev.requiredAssistance, item];
      return { ...prev, requiredAssistance: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateEmergencyForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const created = await addEmergency({
        caller_name: form.caller_name || 'Bystander Caller',
        caller_phone: form.contactNumber || '+91-9876543210',
        patientName: form.patientName,
        patientAge: form.patientAge,
        category: form.emergencyType,
        severity: form.severity || 'CRITICAL',
        description: form.description,
        locationName: form.locationName,
        latitude: form.latitude,
        longitude: form.longitude
      });

      if (created) {
        setSuccessMsg(`Emergency ${created.id} registered! Assigned ambulance: ${created.assigned_ambulance_id || 'Dispatched'}. Opening Live 2-Stage Journey Tracker...`);
        setTimeout(() => {
          navigate(`/journey-tracking/${created.id}`);
        }, 800);
      } else {
        setSubmitting(false);
      }
    } catch (err) {
      alert('Failed to register emergency request.');
      setSubmitting(false);
    }
  };

  const tableColumns = [
    {
      header: 'Incident ID',
      accessor: 'id',
      render: (r) => <span className="font-mono font-bold text-blue-600">{r.id}</span>
    },
    {
      header: 'Patient Details',
      render: (r) => (
        <div>
          <p className="font-bold text-slate-800">{r.patient_name || r.patientName || 'Emergency Patient'}</p>
          <p className="text-[11px] text-slate-400">
            {r.patient_age || r.patientAge ? `${r.patient_age || r.patientAge} yrs` : 'Adult'} • {r.caller_phone || r.contactNumber || 'Contact logged'}
          </p>
        </div>
      )
    },
    {
      header: 'Category',
      render: (r) => (
        <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {r.category || r.emergencyType || 'GENERAL'}
        </span>
      )
    },
    {
      header: 'Pickup Address',
      render: (r) => (
        <span className="text-slate-600 truncate max-w-[190px] block text-xs">
          {r.pickup_address || r.locationName || 'Scene Location'}
        </span>
      )
    },
    {
      header: 'Severity',
      render: (r) => <StatusBadge priority={r.severity || r.priority} />
    },
    {
      header: 'Stage / Status',
      render: (r) => <StatusBadge status={r.journey_stage || r.status} />
    },
    {
      header: 'Track Journey',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/journey-tracking/${r.id}`);
          }}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-xs flex items-center space-x-1"
        >
          <span>Track</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-red-600 uppercase tracking-widest mb-1">
            <HeartPulse className="w-4 h-4 animate-pulse" />
            <span>EMS INTAKE MODULE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Log New Emergency Assistance Request
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Capture patient vitals, incident coordinates, and clinical needs to trigger algorithmic triage and rapid ambulance dispatch.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200">
            {emergencies.filter(e => e.status === 'Pending').length} Pending Dispatch
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form + Interactive Location Picker Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Container */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-sm font-bold text-[#102A43] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Patient & Incident Information</span>
            </h3>

            {/* Patient Name, Age, Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="e.g. Anand Deshmukh"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.patientName && <p className="text-[11px] text-red-500 mt-1">{errors.patientName}</p>}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  value={form.patientAge}
                  onChange={(e) => setForm({ ...form, patientAge: e.target.value })}
                  placeholder="45"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.patientAge && <p className="text-[11px] text-red-500 mt-1">{errors.patientAge}</p>}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender *
                </label>
                <select
                  value={form.patientGender}
                  onChange={(e) => setForm({ ...form, patientGender: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.patientGender && <p className="text-[11px] text-red-500 mt-1">{errors.patientGender}</p>}
              </div>
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Caller Contact Number *
                </label>
                <input
                  type="text"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  placeholder="+91 98220 00123"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.contactNumber && <p className="text-[11px] text-red-500 mt-1">{errors.contactNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Next of Kin / Alternate Contact
                </label>
                <input
                  type="text"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  placeholder="Relative name & phone"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Emergency Type & Description */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Category *
                </label>
                <select
                  value={form.emergencyType}
                  onChange={(e) => setForm({ ...form, emergencyType: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Road Accident">Road Accident (Vehicular Collision / Trauma)</option>
                  <option value="Cardiac Emergency">Cardiac Emergency (Severe Chest Pain / Arrest)</option>
                  <option value="Breathing Problem">Breathing Problem (Severe Dyspnea / Asthma)</option>
                  <option value="Critical Injury">Critical Injury (Industrial / Penetrating Trauma)</option>
                  <option value="Minor Injury">Minor Injury (Extremity Sprain / Fall)</option>
                  <option value="Other">Other Medical Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Description & Reported Symptoms *
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe patient responsiveness, bleeding, breathing difficulty, or vital symptoms..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>

            {/* Location Fields & Quick Presets */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Incident Location & Coordinates *
                </label>
                <button
                  type="button"
                  onClick={handleUseGeolocation}
                  disabled={geoLoading}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center space-x-1"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>{geoLoading ? 'Detecting...' : 'Use Browser GPS'}</span>
                </button>
              </div>

              <input
                type="text"
                value={form.locationName}
                onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                placeholder="Street address, junction, or landmark..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.locationName && <p className="text-[11px] text-red-500 mt-0.5">{errors.locationName}</p>}

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Quick Solapur Spots:</span>
                {quickLandmarks.map((lm, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLandmarkSelect(lm)}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-[10px] font-semibold text-slate-600 transition"
                  >
                    {lm.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Latitude</span>
                  <span className="font-mono font-bold text-slate-800">{form.latitude}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Longitude</span>
                  <span className="font-mono font-bold text-slate-800">{form.longitude}</span>
                </div>
              </div>
            </div>

            {/* Medical Equipment Required Checklist */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Required Ambulance Medical Equipment Checklist
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Oxygen cylinder',
                  'Ventilator',
                  'Defibrillator',
                  'Stretcher',
                  'First aid kit',
                  'Emergency medical kit'
                ].map((item) => {
                  const isChecked = form.requiredAssistance.includes(item);
                  return (
                    <label
                      key={item}
                      onClick={() => toggleAssistance(item)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                        isChecked
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by onClick
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setForm(INITIAL_FORM)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition transform active:scale-95 flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? 'Assessing Triage...' : 'Submit Emergency Request'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Map Picker Assistant */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#102A43] flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Interactive Map Pin Locator</span>
            </h3>
            <span className="text-[11px] text-slate-400">Click map to set point</span>
          </div>

          <MapView
            center={[form.latitude, form.longitude]}
            selectedLocation={[form.latitude, form.longitude]}
            onLocationSelect={handleMapClick}
            height="380px"
          />

          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center space-x-1">
              <span>Automatic Road Graph Node Snapping:</span>
            </p>
            <p className="text-[11px] text-blue-800">
              Any coordinate picked on the map automatically links to the closest intersection node in the Solapur road network graph for Dijkstra calculation.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Requests Log Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#102A43] tracking-tight">
          All Registered Emergency Requests
        </h3>
        <DataTable
          columns={tableColumns}
          data={emergencies}
          searchPlaceholder="Search by patient name, location, or ID..."
          searchField="patientName"
          filterOptions={[
            { label: 'Critical Priority', value: 'Critical' },
            { label: 'High Priority', value: 'High' },
            { label: 'Pending Dispatch', value: 'Pending' },
            { label: 'Completed', value: 'Completed' }
          ]}
          filterField="priority"
          onRowClick={(row) => setSelectedEmergency(row)}
        />
      </div>

      {/* Emergency Detail Modal */}
      {selectedEmergency && (
        <Modal
          isOpen={Boolean(selectedEmergency)}
          onClose={() => setSelectedEmergency(null)}
          title={`Emergency Request: ${selectedEmergency.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <p className="text-base font-extrabold text-slate-900">{selectedEmergency.patientName}</p>
                <p className="text-slate-500">{selectedEmergency.patientAge} years • {selectedEmergency.patientGender}</p>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge priority={selectedEmergency.priority} />
                <StatusBadge status={selectedEmergency.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Incident Type</span>
                <span className="font-bold text-slate-800 text-sm">{selectedEmergency.emergencyType}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Caller Contact</span>
                <span className="font-bold text-slate-800 text-sm">{selectedEmergency.contactNumber}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Symptoms Reported</span>
              <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
                {selectedEmergency.description}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Location Details</span>
              <p className="font-semibold text-slate-800">{selectedEmergency.locationName}</p>
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                Coords: [{selectedEmergency.coords?.[0]}, {selectedEmergency.coords?.[1]}]
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Assistance Required</span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedEmergency.requiredAssistance || []).map((req, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-[11px]">
                    {req}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedEmergency(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Close
              </button>
              {selectedEmergency.status === 'Pending' && (
                <button
                  onClick={() => {
                    const id = selectedEmergency.id;
                    setSelectedEmergency(null);
                    navigate(`/dispatch/${id}`);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                >
                  Proceed to Smart Dispatch →
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
