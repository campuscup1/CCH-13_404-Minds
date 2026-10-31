import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmergencyRequests from './pages/EmergencyRequests';
import EmergencyAssessment from './pages/EmergencyAssessment';
import AmbulanceStations from './pages/AmbulanceStations';
import AmbulanceManagement from './pages/AmbulanceManagement';
import AmbulanceAssignment from './pages/AmbulanceAssignment';
import RoutePrediction from './pages/RoutePrediction';
import Hospitals from './pages/Hospitals';
import HospitalRecommendation from './pages/HospitalRecommendation';
import HospitalRoute from './pages/HospitalRoute';
import DynamicRouting from './pages/DynamicRouting';
import JourneyTracking from './pages/JourneyTracking';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Internal Management Console under DashboardLayout */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/emergencies" element={<EmergencyRequests />} />
        <Route path="/assessment" element={<EmergencyAssessment />} />
        <Route path="/assessment/:id" element={<EmergencyAssessment />} />
        <Route path="/stations" element={<AmbulanceStations />} />
        <Route path="/ambulances" element={<AmbulanceManagement />} />
        <Route path="/dispatch" element={<AmbulanceAssignment />} />
        <Route path="/dispatch/:id" element={<AmbulanceAssignment />} />
        <Route path="/route-prediction" element={<RoutePrediction />} />
        <Route path="/route/ambulance/:id" element={<RoutePrediction />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/hospital-recommendation" element={<HospitalRecommendation />} />
        <Route path="/hospital-recommendation/:id" element={<HospitalRecommendation />} />
        <Route path="/hospital-route" element={<HospitalRoute />} />
        <Route path="/route/hospital/:id" element={<HospitalRoute />} />
        <Route path="/dynamic-routing" element={<DynamicRouting />} />
        <Route path="/journey-tracking" element={<JourneyTracking />} />
        <Route path="/journey-tracking/:id" element={<JourneyTracking />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
