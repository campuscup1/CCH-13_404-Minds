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
  Baby
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Realistic Dummy Emergency Requests
const DUMMY_REQUESTS = [
  {
    id: 'EMG-2026-101',
    patientName: 'Suresh Kumar',
    patientAge: 52,
    patientGender: 'Male',
    callerName: 'Rajesh Patil (Bystander)',
    contactNumber: '+91 98765 43210',
    emergencyType: 'CARDIAC',
    condition: 'Acute chest pain, severe arrhythmia, loss of consciousness',
    severity: 'CRITICAL',
    locationName: 'East Tech Corridor, Gate 2',
    landmark: 'Near IT Park Main Junction • Sector 4',
    assignedAmbulance: 'AMB-103 (ALS)',
    assignedDriver: 'Suresh Patil',
    targetHospital: 'City Memorial Trauma Hospital',
    status: 'EN_ROUTE_TO_PATIENT',
    statusLabel: 'Ambulance En-Route',
    timeAgo: '3 mins ago',
    eta: '2.5 mins'
  },
  {
    id: 'EMG-2026-102',
    patientName: 'Pooja Deshmukh',
    patientAge: 28,
    patientGender: 'Female',
    callerName: 'Amit Deshmukh (Husband)',
    contactNumber: '+91 98220 12345',
    emergencyType: 'PREGNANCY',
    condition: 'Advanced active labor contractions, water broke',
    severity: 'HIGH',
    locationName: 'Rainbow Child Clinic Plaza, Block C',
    landmark: 'Opposite Central Park Gate • Sector 12',
    assignedAmbulance: 'AMB-105 (BLS)',
    assignedDriver: 'Vikram Shinde',
    targetHospital: 'Metro Maternal & Child Center',
    status: 'ARRIVED_AT_SCENE',
    statusLabel: 'Paramedic at Scene',
    timeAgo: '7 mins ago',
    eta: 'At Scene'
  },
  {
    id: 'EMG-2026-103',
    patientName: 'Rameshwar Pawar',
    patientAge: 45,
    patientGender: 'Male',
    callerName: 'Traffic Police Officer Kadam',
    contactNumber: '+91 98900 88776',
    emergencyType: 'TRAUMA',
    condition: 'Two-wheeler collision, open tibia fracture, heavy bleeding',
    severity: 'CRITICAL',
    locationName: 'North Ring Expressway, Mile 4',
    landmark: 'Flyover Ramp Entry • Highway Crossing N3',
    assignedAmbulance: 'AMB-101 (ALS)',
    assignedDriver: 'Rajesh Shinde',
    targetHospital: 'Apex Heart & Trauma Institute',
    status: 'EN_ROUTE_TO_HOSPITAL',
    statusLabel: 'Transfer to Hospital',
    timeAgo: '12 mins ago',
    eta: '4.0 mins to ER'
  },
  {
    id: 'EMG-2026-104',
    patientName: 'Sunita Joshi',
    patientAge: 64,
    patientGender: 'Female',
    callerName: 'Kavita Joshi (Daughter)',
    contactNumber: '+91 97654 32109',
    emergencyType: 'RESPIRATORY',
    condition: 'Severe bronchial asthma attack, oxygen saturation 84%',
    severity: 'CRITICAL',
    locationName: 'Midtown Central Crossing, Apt 402',
    landmark: 'Near Dr. Ambedkar Statue • Sector 17',
    assignedAmbulance: 'AMB-102 (ALS)',
    assignedDriver: 'Amit Kulkarni',
    targetHospital: 'City Memorial Trauma Hospital',
    status: 'EN_ROUTE_TO_PATIENT',
    statusLabel: 'Ambulance En-Route',
    timeAgo: '4 mins ago',
    eta: '3.0 mins'
  },
  {
    id: 'EMG-2026-105',
    patientName: 'Anil Jadhav',
    patientAge: 38,
    patientGender: 'Male',
    callerName: 'Factory Security Supervisor',
    contactNumber: '+91 94231 66554',
    emergencyType: 'GENERAL',
    condition: 'Industrial machinery fall, head contusion, disorientation',
    severity: 'HIGH',
    locationName: 'Apex Industrial Estate, Gate 3',
    landmark: 'MIDC Industrial Corridor • Node N6',
    assignedAmbulance: 'AMB-104 (BLS)',
    assignedDriver: 'Suresh Patil',
    targetHospital: 'LifeLine Multi-Specialty Clinic',
    status: 'ARRIVED_AT_SCENE',
    statusLabel: 'Stabilizing Patient',
    timeAgo: '15 mins ago',
    eta: 'At Scene'
  },
  {
    id: 'EMG-2026-106',
    patientName: 'Farhan Shaikh',
    patientAge: 19,
    patientGender: 'Male',
    callerName: 'College Guard Rathod',
    contactNumber: '+91 91580 99881',
    emergencyType: 'TRAUMA',
    condition: 'Sports accident, suspected spinal trauma and collarbone dislocation',
    severity: 'HIGH',
    locationName: 'City Memorial Stadium Grounds',
    landmark: 'Sports Complex Main Gate • Sector 8',
    assignedAmbulance: 'AMB-101 (ALS)',
    assignedDriver: 'Rajesh Shinde',
    targetHospital: 'Apex Heart & Trauma Institute',
    status: 'COMPLETED',
    statusLabel: 'Admitted to ER',
    timeAgo: '28 mins ago',
    eta: 'Completed'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { emergencies = [] } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL', 'CRITICAL', 'HIGH', 'IN_PROGRESS'

  // Merge newly submitted emergencies from user with dummy data
  const liveNormalized = (emergencies || []).map((e) => ({
    id: e.id,
    patientName: e.patient_name || e.patientName || 'Emergency Patient',
    patientAge: e.patient_age || e.patientAge || 45,
    patientGender: e.patient_gender || e.patientGender || 'Not Specified',
    callerName: e.caller_name || 'Public Helpline Caller',
    contactNumber: e.caller_phone || e.contactNumber || '+91 99999 88888',
    emergencyType: e.category || e.emergencyType || 'GENERAL',
    condition: e.description || 'Immediate emergency medical response requested',
    severity: e.severity || 'CRITICAL',
    locationName: e.pickup_address || e.locationName || 'Live City Coordinate Location',
    landmark: 'Live Public Dispatch Request',
    assignedAmbulance: e.assigned_ambulance_id || 'AMB_ALS_01',
    assignedDriver: 'On-Duty Paramedic Crew',
    targetHospital: e.destination_hospital_id || 'Nearest Level-1 Hospital',
    status: e.journey_stage || 'EN_ROUTE_TO_PATIENT',
    statusLabel: 'Dispatched & Tracking',
    timeAgo: 'Just now',
    eta: '3.5 mins'
  }));

  const allRequests = [...liveNormalized, ...DUMMY_REQUESTS];

  // Filtering
  const filteredRequests = allRequests.filter((req) => {
    const matchesSearch =
      req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.contactNumber.includes(searchTerm) ||
      req.emergencyType.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterSeverity === 'CRITICAL') return req.severity === 'CRITICAL';
    if (filterSeverity === 'HIGH') return req.severity === 'HIGH';
    if (filterSeverity === 'IN_PROGRESS') return req.status !== 'COMPLETED';

    return true;
  });

  const getEmergencyIcon = (type) => {
    switch (type) {
      case 'CARDIAC':
        return <HeartPulse className="w-4 h-4 text-red-600" />;
      case 'TRAUMA':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'RESPIRATORY':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'PREGNANCY':
        return <Baby className="w-4 h-4 text-rose-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider">
            DISPATCH OPERATIONS
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#102A43] tracking-tight mt-1">
            Emergency Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active citizen emergency calls with patient details, exact locations, and contact information.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient, location, phone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'CRITICAL', label: 'Critical' },
              { id: 'HIGH', label: 'High' },
              { id: 'IN_PROGRESS', label: 'Active' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterSeverity(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  filterSeverity === f.id
                    ? 'bg-[#102A43] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Request Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRequests.map((req) => {
          const isCritical = req.severity === 'CRITICAL';
          const isCompleted = req.status === 'COMPLETED';

          return (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Card Header: Badges & ID */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md font-black text-[10px] tracking-wide ${
                        isCritical
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.severity}
                    </span>
                    <span className="text-xs font-black text-slate-400">
                      {req.id}
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{req.timeAgo}</span>
                  </span>
                </div>

                {/* Patient Name & Caller Info */}
                <div className="mt-3.5 flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-[#102A43]">
                      {req.patientName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {req.patientAge} yrs • {req.patientGender}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Caller: {req.callerName}
                    </p>
                  </div>
                </div>

                {/* Location Details */}
                <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">
                        {req.locationName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {req.landmark}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Phone Details */}
                <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/60 border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-bold text-xs text-slate-800">
                      {req.contactNumber}
                    </span>
                  </div>
                  <a
                    href={`tel:${req.contactNumber}`}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Call
                  </a>
                </div>

                {/* Medical Condition */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5 mb-1">
                    {getEmergencyIcon(req.emergencyType)}
                    <span className="font-extrabold text-xs text-slate-800">
                      {req.emergencyType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    {req.condition}
                  </p>
                </div>

                {/* Assigned Ambulance & Hospital */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold">Ambulance</span>
                    <span className="font-bold text-slate-800">{req.assignedAmbulance}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold">Hospital</span>
                    <span className="font-bold text-slate-800 truncate block">{req.targetHospital}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Status & Live Tracking Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCompleted ? 'bg-emerald-500' : 'bg-blue-600 animate-ping'
                    }`}
                  />
                  <span>{req.statusLabel}</span>
                </span>

                <button
                  onClick={() => navigate(`/journey-tracking/${req.id}`)}
                  className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-[#102A43] hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
                >
                  <Radio className="w-3.5 h-3.5 text-blue-400" />
                  <span>Track</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
