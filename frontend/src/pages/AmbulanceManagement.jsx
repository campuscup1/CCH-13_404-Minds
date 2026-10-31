import React, { useState } from 'react';
import {
  Ambulance,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
  Phone,
  Fuel,
  Gauge,
  Edit,
  Trash2,
  Eye,
  MapPin
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { ROAD_NODES } from '../data/roadNetwork';

export default function AmbulanceManagement() {
  const { ambulances, stations, refreshAllData } = useApp();

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    vehicleNumber: '',
    type: 'Advanced Life Support (ALS)',
    stationId: 'STAT-01',
    currentNodeId: 'N_CIVIL',
    status: 'Available',
    driverName: '',
    driverPhone: '',
    driverExperience: '5 years',
    fuelLevel: '90%',
    equipment: ['Oxygen cylinder', 'Stretcher', 'First aid kit']
  });

  const allEquipmentOptions = [
    'Oxygen cylinder',
    'Ventilator',
    'Defibrillator',
    'Stretcher',
    'First aid kit',
    'Emergency medical kit'
  ];

  const filteredAmbulances = ambulances.filter(a => {
    const vNum = a.vehicle_number || a.vehicleNumber || '';
    const dName = a.driverName || a.assigned_driver_id || '';
    const aId = a.id || '';

    const matchesSearch =
      aId.toLowerCase().includes(search.toLowerCase()) ||
      vNum.toLowerCase().includes(search.toLowerCase()) ||
      dName.toLowerCase().includes(search.toLowerCase());

    const matchesStation = stationFilter === 'ALL' || a.station_id === stationFilter || a.stationId === stationFilter;
    const matchesStatus = statusFilter === 'ALL' || (a.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStation && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      vehicleNumber: 'MH-13-KL-' + Math.floor(1000 + Math.random() * 9000),
      type: 'Advanced Life Support (ALS)',
      stationId: stations[0]?.id || 'STAT-01',
      currentNodeId: 'N_CIVIL',
      status: 'Available',
      driverName: '',
      driverPhone: '+91 98220 ',
      driverExperience: '4 years',
      fuelLevel: '95%',
      equipment: ['Oxygen cylinder', 'Defibrillator', 'Stretcher', 'First aid kit']
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (amb) => {
    setEditId(amb.id);
    setForm({
      vehicleNumber: amb.vehicleNumber,
      type: amb.type,
      stationId: amb.stationId,
      currentNodeId: amb.currentNodeId,
      status: amb.status,
      driverName: amb.driverName,
      driverPhone: amb.driverPhone,
      driverExperience: amb.driverExperience,
      fuelLevel: amb.fuelLevel,
      equipment: amb.equipment || []
    });
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = (ambId, newStatus) => {
    const current = storageService.getAmbulances();
    const updated = current.map(a => (a.id === ambId ? { ...a, status: newStatus } : a));
    storageService.saveAmbulances(updated);
    refreshAllData();
  };

  const handleDelete = (ambId) => {
    if (window.confirm(`Are you sure you want to delete ambulance ${ambId}?`)) {
      const current = storageService.getAmbulances();
      const updated = current.filter(a => a.id !== ambId);
      storageService.saveAmbulances(updated);
      refreshAllData();
    }
  };

  const toggleEquipment = (eq) => {
    setForm(prev => {
      const exists = prev.equipment.includes(eq);
      return {
        ...prev,
        equipment: exists ? prev.equipment.filter(e => e !== eq) : [...prev.equipment, eq]
      };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const current = storageService.getAmbulances();
    const stationObj = stations.find(s => s.id === form.stationId);
    const nodeObj = ROAD_NODES[form.currentNodeId] || ROAD_NODES.N_CIVIL;

    if (editId) {
      const updated = current.map(a => {
        if (a.id === editId) {
          return {
            ...a,
            vehicleNumber: form.vehicleNumber,
            type: form.type,
            stationId: form.stationId,
            stationName: stationObj?.name || a.stationName,
            currentNodeId: form.currentNodeId,
            locationName: nodeObj.name,
            coords: nodeObj.coords,
            status: form.status,
            driverName: form.driverName,
            driverPhone: form.driverPhone,
            driverExperience: form.driverExperience,
            fuelLevel: form.fuelLevel,
            equipment: form.equipment
          };
        }
        return a;
      });
      storageService.saveAmbulances(updated);
    } else {
      const newAmb = {
        id: `AMB-${100 + current.length + 1}`,
        vehicleNumber: form.vehicleNumber,
        type: form.type,
        stationId: form.stationId,
        stationName: stationObj?.name || 'Civil Depot',
        currentNodeId: form.currentNodeId,
        locationName: nodeObj.name,
        coords: nodeObj.coords,
        status: form.status,
        driverName: form.driverName,
        driverPhone: form.driverPhone,
        driverExperience: form.driverExperience,
        fuelLevel: form.fuelLevel,
        speedKmh: 45,
        equipment: form.equipment
      };
      storageService.saveAmbulances([...current, newAmb]);
    }

    refreshAllData();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Ambulance Fleet Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status monitoring, medical onboard apparatus inventory, and telemetry for {ambulances.length} fleet units.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Cards Grid
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ambulance</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vehicle number, ID, or driver..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter by Station */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-semibold">Depot:</span>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50"
            >
              <option value="ALL">All Stations</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Filter by Availability */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="On the way">On the way</option>
              <option value="Busy">Busy</option>
              <option value="Out of service">Out of service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#102A43]/5 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Ambulance</th>
                  <th className="py-3.5 px-4">Station / Location</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4">Onboard Equipment</th>
                  <th className="py-3.5 px-4">Driver & Telemetry</th>
                  <th className="py-3.5 px-4 text-right">Quick Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAmbulances.map(amb => (
                  <tr key={amb.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          <Ambulance className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{amb.id}</p>
                          <p className="text-[11px] font-mono text-slate-500">{amb.vehicleNumber}</p>
                          <span className="text-[10px] text-blue-600 font-semibold">{amb.type}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px]">
                      <p className="font-semibold text-slate-800 truncate">{amb.stationName}</p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{amb.locationName}</span>
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={amb.status} />
                    </td>

                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {(amb.equipment || []).slice(0, 3).map((eq, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {eq}
                          </span>
                        ))}
                        {(amb.equipment || []).length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                            +{(amb.equipment || []).length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-semibold text-slate-800">{amb.driverName}</p>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{amb.driverPhone}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">Fuel: {amb.fuelLevel}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={amb.status}
                        onChange={(e) => handleQuickStatusChange(amb.id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                      >
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="On the way">On the way</option>
                        <option value="Busy">Busy</option>
                        <option value="Out of service">Out of service</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedAmbulance(amb)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(amb)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                          title="Edit Unit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(amb.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredAmbulances.map(amb => (
            <div
              key={amb.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    {amb.id}
                  </span>
                  <StatusBadge status={amb.status} />
                </div>

                <div className="mt-3">
                  <p className="font-extrabold text-slate-900 text-sm">{amb.vehicleNumber}</p>
                  <p className="text-xs text-blue-700 font-semibold mt-0.5">{amb.type}</p>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{amb.locationName}</span>
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Driver:</span>
                    <span className="font-bold text-slate-800">{amb.driverName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Fuel:</span>
                    <span className="font-bold text-emerald-600">{amb.fuelLevel}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Equipment:</span>
                    <div className="flex flex-wrap gap-1">
                      {(amb.equipment || []).map((eq, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedAmbulance(amb)}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  View Details
                </button>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(amb)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(amb.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ambulance Detail Modal */}
      {selectedAmbulance && (
        <Modal
          isOpen={Boolean(selectedAmbulance)}
          onClose={() => setSelectedAmbulance(null)}
          title={`Ambulance Unit: ${selectedAmbulance.id} (${selectedAmbulance.vehicleNumber})`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800 text-base">{selectedAmbulance.type}</p>
                <p className="text-slate-500">Base Depot: {selectedAmbulance.stationName}</p>
              </div>
              <StatusBadge status={selectedAmbulance.status} className="text-xs px-3 py-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Driver</span>
                <p className="font-bold text-slate-800 text-sm">{selectedAmbulance.driverName}</p>
                <p className="text-slate-500 mt-0.5">{selectedAmbulance.driverPhone} • {selectedAmbulance.driverExperience}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Location</span>
                <p className="font-bold text-slate-800 text-sm">{selectedAmbulance.locationName}</p>
                <p className="text-slate-500 font-mono mt-0.5">[{selectedAmbulance.coords?.[0]}, {selectedAmbulance.coords?.[1]}]</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                Installed Medical Equipment
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(selectedAmbulance.equipment || []).map((eq, i) => (
                  <div key={i} className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{eq}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedAmbulance(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editId ? `Edit Ambulance ${editId}` : 'Add New Ambulance to Fleet'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Reg Number</label>
                <input
                  type="text"
                  required
                  value={form.vehicleNumber}
                  onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                  placeholder="MH-13-AZ-1102"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ambulance Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="Advanced Life Support (ALS)">Advanced Life Support (ALS)</option>
                  <option value="Basic Life Support (BLS)">Basic Life Support (BLS)</option>
                  <option value="Cardiac Care Unit (CCU)">Cardiac Care Unit (CCU)</option>
                  <option value="Mobile Intensive Care Unit (MICU)">Mobile Intensive Care Unit (MICU)</option>
                  <option value="Trauma & Emergency Care">Trauma & Emergency Care</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Depot</label>
                <select
                  value={form.stationId}
                  onChange={(e) => setForm({ ...form, stationId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Location Node</label>
                <select
                  value={form.currentNodeId}
                  onChange={(e) => setForm({ ...form, currentNodeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {Object.entries(ROAD_NODES).map(([id, node]) => (
                    <option key={id} value={id}>{node.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                  placeholder="Driver Full Name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driver Phone</label>
                <input
                  type="text"
                  required
                  value={form.driverPhone}
                  onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                  placeholder="+91 98220 00000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {/* Equipment Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Installed Medical Equipment
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allEquipmentOptions.map(eq => {
                  const isChecked = form.equipment.includes(eq);
                  return (
                    <label
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                        isChecked ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-blue-600"
                      />
                      <span>{eq}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
              >
                {editId ? 'Save Changes' : 'Add to Fleet'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
