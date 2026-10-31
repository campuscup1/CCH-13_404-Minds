import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Clock,
  Activity,
  Ambulance,
  Building2,
  CheckCircle2,
  Filter
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import StatCard from '../components/StatCard';
import { useApp } from '../context/AppContext';

export default function Analytics() {
  const { emergencies, ambulances, hospitals } = useApp();
  const [dateRange, setDateRange] = useState('7D'); // 'Today', '7D', '30D'

  // Computed metrics
  const totalCalls = emergencies.length;
  const criticalCount = emergencies.filter(e => e.priority === 'Critical').length;
  const completedCount = emergencies.filter(e => e.status === 'Completed').length;
  const avgResponseTime = '3.6 mins';
  const avgHospitalTime = '8.2 mins';
  const fleetUtilization = Math.round(
    ((ambulances.filter(a => a.status !== 'Available').length) / (ambulances.length || 1)) * 100
  );
  const totalBedsOccupied = hospitals.reduce(
    (acc, h) => acc + (h.totalEmergencyBeds - h.availableEmergencyBeds) + (h.totalIcuBeds - h.availableIcuBeds),
    0
  );
  const totalBedsCapacity = hospitals.reduce(
    (acc, h) => acc + h.totalEmergencyBeds + h.totalIcuBeds,
    0
  );
  const bedUtilization = Math.round((totalBedsOccupied / (totalBedsCapacity || 1)) * 100);

  // Daily Call Trends
  const dailyCallsData = [
    { day: 'Mon', roadAccident: 4, cardiac: 3, breathing: 2, total: 9 },
    { day: 'Tue', roadAccident: 6, cardiac: 2, breathing: 3, total: 11 },
    { day: 'Wed', roadAccident: 3, cardiac: 5, breathing: 1, total: 9 },
    { day: 'Thu', roadAccident: 7, cardiac: 4, breathing: 4, total: 15 },
    { day: 'Fri', roadAccident: 8, cardiac: 6, breathing: 3, total: 17 },
    { day: 'Sat', roadAccident: 11, cardiac: 4, breathing: 2, total: 17 },
    { day: 'Sun', roadAccident: 9, cardiac: 5, breathing: 3, total: 17 }
  ];

  // Response Time Trend Data
  const responseTimeTrend = [
    { day: 'Mon', responseTime: 4.1, target: 5.0 },
    { day: 'Tue', responseTime: 3.8, target: 5.0 },
    { day: 'Wed', responseTime: 3.5, target: 5.0 },
    { day: 'Thu', responseTime: 3.9, target: 5.0 },
    { day: 'Fri', responseTime: 3.6, target: 5.0 },
    { day: 'Sat', responseTime: 3.4, target: 5.0 },
    { day: 'Sun', responseTime: 3.2, target: 5.0 }
  ];

  // Hospital Bed Utilization Data
  const hospitalBedData = hospitals.map(h => ({
    name: h.name.replace('Hospital', '').replace('Rugnalaya', '').trim().slice(0, 14),
    availableBeds: h.availableEmergencyBeds + h.availableIcuBeds,
    occupiedBeds: (h.totalEmergencyBeds + h.totalIcuBeds) - (h.availableEmergencyBeds + h.availableIcuBeds)
  }));

  // Emergency Categories Pie Data
  const typeCounts = emergencies.reduce((acc, e) => {
    acc[e.emergencyType] = (acc[e.emergencyType] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Emergency ID,Patient Name,Emergency Type,Priority,Status,Location\n' +
      emergencies
        .map(e => `${e.id},"${e.patientName}","${e.emergencyType}",${e.priority},${e.status},"${e.locationName}"`)
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mediroute_ems_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>EXECUTIVE DISPATCH METRICS</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Emergency Analytics & Response Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive telemetry on city response times, vehicle utilization, and hospital bed occupancy across Solapur.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {/* Date Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {['Today', '7D', '30D'].map(tab => (
              <button
                key={tab}
                onClick={() => setDateRange(tab)}
                className={`px-3 py-1 rounded-lg transition ${
                  dateRange === tab ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Emergencies"
          value={totalCalls}
          subtitle="Registered this period"
          icon={Activity}
          color="navy"
        />
        <StatCard
          title="Critical Cases"
          value={criticalCount}
          subtitle="Immediate ALS response"
          icon={Activity}
          color="red"
        />
        <StatCard
          title="Completed Trips"
          value={completedCount}
          subtitle="Hospital admitted"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Avg Dispatch ETA"
          value={avgResponseTime}
          subtitle="Target: < 5.0 mins"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Fleet Utilization"
          value={`${fleetUtilization}%`}
          subtitle="Active / assigned"
          icon={Ambulance}
          color="orange"
        />
        <StatCard
          title="Bed Occupancy"
          value={`${bedUtilization}%`}
          subtitle="ICU & Emergency"
          icon={Building2}
          color="blue"
        />
      </div>

      {/* Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Emergency Requests (Stacked Bar Chart) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Daily Incident Volume by Emergency Type
              </h3>
              <p className="text-xs text-slate-500">Call distribution across last 7 days</p>
            </div>
            <span className="text-xs font-bold text-blue-600">Solapur Metro</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCallsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="roadAccident" name="Road Accident" fill="#EF4444" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cardiac" name="Cardiac" fill="#3B82F6" stackId="a" />
                <Bar dataKey="breathing" name="Respiratory" fill="#10B981" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emergency Types Breakdown (Pie Chart) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Incident Category Share</h3>
            <span className="text-xs text-slate-400">Total: {totalCalls}</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Average Response Time Line Chart */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Average Ambulance Response Time (minutes)
              </h3>
              <p className="text-xs text-slate-500">Benchmark vs Solapur Target SLA of 5.0 mins</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Within Target
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 6]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  name="Observed Response Time"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Maximum Target SLA"
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hospital Occupancy vs Available Beds Bar Chart */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Hospital Critical Care Bed Occupancy
              </h3>
              <p className="text-xs text-slate-500">Available vs Occupied ICU/Emergency beds</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Live Solapur Feed</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hospitalBedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="availableBeds"
                  name="Available Beds"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="occupiedBeds"
                  name="Occupied Beds"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
