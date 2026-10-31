import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Bed,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Activity,
  Heart,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import MapView from '../components/MapView';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { adminApi } from '../services/api';
import { storageService } from '../services/storageService';
import { ROAD_NODES } from '../data/roadNetwork';

export default function Hospitals() {
  const { hospitals, refreshAllData } = useApp();

  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: 12.9352,
    longitude: 77.6250,
    phone: '+91-80-2222-1000',
    hasEmergencyDept: true,
    hasICU: true,
    totalIcuBeds: 20,
    availableIcuBeds: 5,
    totalEmergencyBeds: 35,
    availableEmergencyBeds: 8,
    traumaLevel: 'Level 1 Trauma Center',
    services: ['Emergency', 'ICU', 'Trauma', 'Cardiac']
  });

  const availableServices = [
    'Emergency',
    'ICU',
    'Cardiac',
    'Trauma',
    'Orthopedic',
    'Neurology',
    'General Medicine'
  ];

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch =
      (h.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (h.address || '').toLowerCase().includes(search.toLowerCase());

    const matchesService =
      serviceFilter === 'ALL' || (h.specialties && h.specialties.includes(serviceFilter)) || (h.services && h.services.includes(serviceFilter));

    return matchesSearch && matchesService;
  });

  const handleBedAdjust = async (hospId, bedType, delta) => {
    const target = hospitals.find(h => h.id === hospId);
    if (!target) return;

    let newIcu = target.available_icu_beds ?? target.availableIcuBeds ?? 0;
    let newEr = target.available_er_beds ?? target.availableEmergencyBeds ?? 0;

    if (bedType === 'icu') {
      newIcu = Math.max(0, newIcu + delta);
    } else {
      newEr = Math.max(0, newEr + delta);
    }

    try {
      await adminApi.updateHospitalCapacity(hospId, newIcu, newEr);
      await refreshAllData();
    } catch (e) {
      console.warn('Backend update capacity error', e);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      name: '',
      address: '',
      latitude: 17.6650,
      longitude: 75.9080,
      phone: '+91 217 ',
      hasEmergencyDept: true,
      hasICU: true,
      totalIcuBeds: 15,
      availableIcuBeds: 4,
      totalEmergencyBeds: 25,
      availableEmergencyBeds: 6,
      traumaLevel: 'Level 2 Trauma Center',
      services: ['Emergency', 'ICU', 'Trauma', 'General Medicine']
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hosp) => {
    setEditId(hosp.id);
    setForm({
      name: hosp.name,
      address: hosp.address,
      latitude: hosp.coords[0],
      longitude: hosp.coords[1],
      phone: hosp.phone,
      hasEmergencyDept: hosp.hasEmergencyDept,
      hasICU: hosp.hasICU,
      totalIcuBeds: hosp.totalIcuBeds,
      availableIcuBeds: hosp.availableIcuBeds,
      totalEmergencyBeds: hosp.totalEmergencyBeds,
      availableEmergencyBeds: hosp.availableEmergencyBeds,
      traumaLevel: hosp.traumaLevel,
      services: hosp.services || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = (hospId) => {
    if (window.confirm('Delete this hospital from emergency network?')) {
      const current = storageService.getHospitals();
      const updated = current.filter(h => h.id !== hospId);
      storageService.saveHospitals(updated);
      refreshAllData();
    }
  };

  const toggleService = (srv) => {
    setForm(prev => {
      const exists = prev.services.includes(srv);
      return {
        ...prev,
        services: exists ? prev.services.filter(s => s !== srv) : [...prev.services, srv]
      };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const current = storageService.getHospitals();

    if (editId) {
      const updated = current.map(h => {
        if (h.id === editId) {
          return {
            ...h,
            name: form.name,
            address: form.address,
            coords: [Number(form.latitude), Number(form.longitude)],
            phone: form.phone,
            hasEmergencyDept: form.hasEmergencyDept,
            hasICU: form.hasICU,
            totalIcuBeds: Number(form.totalIcuBeds),
            availableIcuBeds: Number(form.availableIcuBeds),
            totalEmergencyBeds: Number(form.totalEmergencyBeds),
            availableEmergencyBeds: Number(form.availableEmergencyBeds),
            traumaLevel: form.traumaLevel,
            services: form.services
          };
        }
        return h;
      });
      storageService.saveHospitals(updated);
    } else {
      const newHosp = {
        id: `HOSP-0${current.length + 1}`,
        name: form.name,
        address: form.address,
        coords: [Number(form.latitude), Number(form.longitude)],
        phone: form.phone,
        hasEmergencyDept: form.hasEmergencyDept,
        hasICU: form.hasICU,
        totalIcuBeds: Number(form.totalIcuBeds),
        availableIcuBeds: Number(form.availableIcuBeds),
        totalEmergencyBeds: Number(form.totalEmergencyBeds),
        availableEmergencyBeds: Number(form.availableEmergencyBeds),
        traumaLevel: form.traumaLevel,
        services: form.services,
        rating: 4.5,
        nodeId: 'N_CIVIL'
      };
      storageService.saveHospitals([...current, newHosp]);
    }

    refreshAllData();
    setIsModalOpen(false);
  };

  const mapMarkers = hospitals.map(h => ({
    id: h.id,
    title: h.name,
    subtitle: `${h.available_er_beds ?? h.availableEmergencyBeds ?? 0} ER Beds • ${h.available_icu_beds ?? h.availableIcuBeds ?? 0} ICU Beds`,
    coords: h.coords || (h.coordinate ? [h.coordinate.lat, h.coordinate.lon] : [12.9352, 77.6250]),
    type: 'hospital'
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Hospital Management & Real-time Bed Intake
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track emergency department services, live available ICU/trauma beds, and specialty clinical readiness for {hospitals.length} receiving centers.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hospital Facility</span>
        </button>
      </div>

      {/* Map of Hospitals */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Hospital Network Geographic Distribution</span>
          </h3>
          <span className="text-xs text-slate-500">{hospitals.length} Facilities Monitored</span>
        </div>
        <MapView markers={mapMarkers} height="360px" />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospital name or address..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold">Specialty:</span>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50"
          >
            <option value="ALL">All Medical Services</option>
            {availableServices.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hospitals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.map(hosp => (
          <div
            key={hosp.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {hosp.id}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base mt-1.5">{hosp.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{hosp.address}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(hosp)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(hosp.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Trauma Badge */}
              <div className="mt-3 flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {hosp.traumaLevel}
                </span>
                {hosp.isGovt && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Government
                  </span>
                )}
              </div>

              {/* Live Bed Counters with Quick +/- Adjusters */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Emergency Beds */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Emerg Beds</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleBedAdjust(hosp.id, 'emg', -1)}
                        className="p-0.5 text-slate-400 hover:text-red-600"
                        title="Decrement available bed"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleBedAdjust(hosp.id, 'emg', 1)}
                        className="p-0.5 text-slate-400 hover:text-emerald-600"
                        title="Increment available bed"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline space-x-1">
                    <span className="text-xl font-black text-emerald-700">
                      {hosp.availableEmergencyBeds}
                    </span>
                    <span className="text-xs text-slate-400">/ {hosp.totalEmergencyBeds}</span>
                  </div>
                </div>

                {/* ICU Beds */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">ICU Beds</span>
                    {hosp.hasICU && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleBedAdjust(hosp.id, 'icu', -1)}
                          className="p-0.5 text-slate-400 hover:text-red-600"
                          title="Decrement available bed"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleBedAdjust(hosp.id, 'icu', 1)}
                          className="p-0.5 text-slate-400 hover:text-emerald-600"
                          title="Increment available bed"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline space-x-1">
                    {hosp.hasICU ? (
                      <>
                        <span className="text-xl font-black text-blue-700">
                          {hosp.availableIcuBeds}
                        </span>
                        <span className="text-xs text-slate-400">/ {hosp.totalIcuBeds}</span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">No ICU Dept</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Specialized Services Badges */}
              <div className="mt-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">
                  Available Specialties:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(hosp.services || []).map((srv, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-200"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{hosp.phone}</span>
              </span>
              <button
                onClick={() => setSelectedHospital(hosp)}
                className="text-blue-600 font-bold hover:underline"
              >
                Inspect Facility
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <Modal
          isOpen={Boolean(selectedHospital)}
          onClose={() => setSelectedHospital(null)}
          title={`Hospital Facility: ${selectedHospital.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p className="font-bold text-slate-900 text-sm">{selectedHospital.name}</p>
              <p className="text-slate-600">{selectedHospital.address}</p>
              <p className="text-slate-500 font-mono text-[11px]">
                Coordinates: [{selectedHospital.coords?.[0]}, {selectedHospital.coords?.[1]}]
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                  Available Emergency Beds
                </span>
                <span className="text-2xl font-black text-emerald-900">
                  {selectedHospital.availableEmergencyBeds}
                </span>
                <span className="text-[11px] text-emerald-700 block">
                  out of {selectedHospital.totalEmergencyBeds} total
                </span>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] text-blue-700 uppercase font-bold block">
                  Available ICU Beds
                </span>
                <span className="text-2xl font-black text-blue-900">
                  {selectedHospital.availableIcuBeds}
                </span>
                <span className="text-[11px] text-blue-700 block">
                  out of {selectedHospital.totalIcuBeds} total
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Clinical Departments & Services
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedHospital.services || []).map((srv, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold"
                  >
                    {srv}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedHospital(null)}
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
          title={editId ? 'Edit Hospital Facility' : 'Register New Hospital Facility'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Solapur Heart & Trauma Institute"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street address in Solapur"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Beds (Avail / Total)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.availableEmergencyBeds}
                    onChange={(e) => setForm({ ...form, availableEmergencyBeds: e.target.value })}
                    className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-200"
                    placeholder="Avail"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.totalEmergencyBeds}
                    onChange={(e) => setForm({ ...form, totalEmergencyBeds: e.target.value })}
                    className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-200"
                    placeholder="Total"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ICU Beds (Avail / Total)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.availableIcuBeds}
                    onChange={(e) => setForm({ ...form, availableIcuBeds: e.target.value })}
                    className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-200"
                    placeholder="Avail"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.totalIcuBeds}
                    onChange={(e) => setForm({ ...form, totalIcuBeds: e.target.value })}
                    className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-200"
                    placeholder="Total"
                  />
                </div>
              </div>
            </div>

            {/* Services Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Specialized Services Offered
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableServices.map(srv => {
                  const isChecked = form.services.includes(srv);
                  return (
                    <label
                      key={srv}
                      onClick={() => toggleService(srv)}
                      className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-blue-600"
                      />
                      <span>{srv}</span>
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
                {editId ? 'Save Changes' : 'Register Facility'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
