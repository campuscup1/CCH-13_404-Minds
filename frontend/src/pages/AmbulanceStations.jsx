import React, { useState } from 'react';
import {
  Building,
  Plus,
  Search,
  MapPin,
  Ambulance,
  Phone,
  User,
  Edit,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import MapView from '../components/MapView';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';

export default function AmbulanceStations() {
  const { stations, ambulances, refreshAllData } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    location: '',
    latitude: 17.6650,
    longitude: 75.9080,
    totalAmbulances: 3,
    phone: '',
    headParamedic: ''
  });

  const filteredStations = stations.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.address || s.location || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      name: '',
      location: '',
      latitude: 17.6650,
      longitude: 75.9080,
      totalAmbulances: 2,
      phone: '+91 217 ',
      headParamedic: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (station) => {
    setEditId(station.id);
    setForm({
      name: station.name,
      location: station.location,
      latitude: station.coords[0],
      longitude: station.coords[1],
      totalAmbulances: station.totalAmbulances,
      phone: station.phone,
      headParamedic: station.headParamedic
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this ambulance station?')) {
      const current = storageService.getStations();
      const updated = current.filter(s => s.id !== id);
      storageService.saveStations(updated);
      refreshAllData();
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const current = storageService.getStations();

    if (editId) {
      const updated = current.map(s => {
        if (s.id === editId) {
          return {
            ...s,
            name: form.name,
            location: form.location,
            coords: [Number(form.latitude), Number(form.longitude)],
            totalAmbulances: Number(form.totalAmbulances),
            phone: form.phone,
            headParamedic: form.headParamedic
          };
        }
        return s;
      });
      storageService.saveStations(updated);
    } else {
      const newStation = {
        id: `STAT-0${current.length + 1}`,
        name: form.name,
        location: form.location,
        coords: [Number(form.latitude), Number(form.longitude)],
        totalAmbulances: Number(form.totalAmbulances),
        availableAmbulances: Number(form.totalAmbulances),
        busyAmbulances: 0,
        phone: form.phone,
        headParamedic: form.headParamedic,
        nodeId: 'N_SAAT_RASTA'
      };
      storageService.saveStations([...current, newStation]);
    }

    refreshAllData();
    setIsModalOpen(false);
  };

  // Map markers for stations
  const mapMarkers = stations.map(s => ({
    id: s.id,
    title: s.name,
    subtitle: `${s.address || s.location || 'Station Area'} • ${s.available_ambulances ?? s.availableAmbulances ?? 0}/${s.total_ambulances ?? s.totalAmbulances ?? 0} Available`,
    coords: s.coords || (s.coordinate ? [s.coordinate.lat, s.coordinate.lon] : [12.9352, 77.6145]),
    type: 'station'
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Ambulance Station Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage regional dispatch depots, base vehicle capacity, and coverage hubs across Solapur City.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Depot</span>
        </button>
      </div>

      {/* Map of Stations */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Station Geographic Network Map</span>
          </h3>
          <span className="text-xs text-slate-500">{stations.length} Active Depots</span>
        </div>
        <MapView markers={mapMarkers} height="360px" />
      </div>

      {/* Search and Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search station by name or sector..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredStations.length} depots
          </span>
        </div>

        {/* Stations Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStations.map(station => {
            // Count actual ambulances linked to this station
            const linkedAmbs = ambulances.filter(a => a.stationId === station.id);
            const availCount = linkedAmbs.filter(a => a.status === 'Available').length;

            return (
              <div
                key={station.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {station.id}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{station.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{station.location}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(station)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Depot"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(station.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                      title="Delete Depot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Fleet Count KPI */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Fleet</span>
                    <span className="font-extrabold text-slate-800 text-sm">{station.totalAmbulances}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">Available</span>
                    <span className="font-extrabold text-emerald-800 text-sm">
                      {availCount || station.availableAmbulances}
                    </span>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <span className="text-[10px] text-amber-600 uppercase font-bold block">Assigned</span>
                    <span className="font-extrabold text-amber-800 text-sm">
                      {station.totalAmbulances - (availCount || station.availableAmbulances)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{station.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Officer: {station.headParamedic}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Station Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editId ? 'Edit Ambulance Depot' : 'Register New Ambulance Depot'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Depot Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Shelgi North Response Hub"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Address / Landmark</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Near Shelgi Toll Gate, Ring Bypass"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Ambulance Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  required
                  value={form.totalAmbulances}
                  onChange={(e) => setForm({ ...form, totalAmbulances: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Officer / Head Paramedic</label>
              <input
                type="text"
                required
                value={form.headParamedic}
                onChange={(e) => setForm({ ...form, headParamedic: e.target.value })}
                placeholder="e.g. Officer Ramesh Patil"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
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
                {editId ? 'Save Changes' : 'Create Depot'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
