import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import {
  authApi,
  publicApi,
  emergencyApi,
  adminApi,
  simulationApi
} from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [stations, setStations] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeJourney, setActiveJourney] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminOverview, setAdminOverview] = useState(null);
  const [roadGraph, setRoadGraph] = useState({ nodes: [], edges: [] });

  // Road graph dynamic conditions
  const [blockedEdgeIds, setBlockedEdgeIds] = useState(new Set());
  const [trafficMultipliers, setTrafficMultipliers] = useState({});
  const [algorithmPreference, setAlgorithmPreference] = useState('Bidirectional A*');

  // Load user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
    refreshAllData();
  }, []);

  const refreshAllData = async () => {
    try {
      // 1. Fetch public map data for road graph & base topology
      const mapData = await publicApi.getMapData().catch(() => null);
      if (mapData) {
        if (mapData.nodes && mapData.edges) {
          setRoadGraph({ nodes: mapData.nodes, edges: mapData.edges });
          const blocked = new Set();
          mapData.edges.forEach(e => {
            if (e.is_blocked) blocked.add(`${e.u}-${e.v}`);
          });
          setBlockedEdgeIds(blocked);
        }

        // Base fallback stations
        if (mapData.stations) {
          setStations(mapData.stations.map(s => ({
            ...s,
            coords: [s.coordinate?.lat || 12.9352, s.coordinate?.lon || 77.6145],
            totalAmbulances: s.available_ambulances_count || 2,
            location: `Nearest Node: ${s.nearest_node_id}`
          })));
        }

        // Base fallback hospitals
        if (mapData.hospitals) {
          setHospitals(mapData.hospitals.map(h => ({
            ...h,
            coords: [h.coordinate?.lat || 12.9716, h.coordinate?.lon || 77.5946],
            availableEmergencyBeds: h.available_er_beds,
            availableIcuBeds: h.available_icu_beds,
            totalEmergencyBeds: h.total_er_beds,
            totalIcuBeds: h.total_icu_beds,
            hasICU: h.total_icu_beds > 0,
            hasTraumaUnit: h.trauma_level === 1
          })));
        }

        // Base fallback ambulances
        if (mapData.ambulances) {
          setAmbulances(mapData.ambulances.map(a => ({
            ...a,
            vehicleNumber: a.vehicle_number,
            type: a.vehicle_type,
            coords: [a.current_location?.lat || 12.9352, a.current_location?.lon || 77.6145],
            currentNodeId: a.current_node_id || 'N1'
          })));
        }
      }

      // 2. Fetch authenticated Admin data if logged in
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user_session');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') {
          // A. Fetch Admin Overview Telemetry
          try {
            const overview = await adminApi.getOverview();
            if (overview) {
              setAdminOverview(overview);
            }
          } catch (e) {
            console.warn('Admin overview fetch warning', e);
          }

          // B. Fetch Admin Stations
          try {
            const adminStations = await adminApi.getStations();
            if (adminStations && adminStations.length > 0) {
              setStations(adminStations.map(s => ({
                ...s,
                coords: [s.coordinate?.lat || 12.9352, s.coordinate?.lon || 77.6145],
                totalAmbulances: s.available_ambulances_count || s.total_bays || 2,
                location: `Nearest Junction: ${s.nearest_node_id}`
              })));
            }
          } catch (e) {
            console.warn('Admin stations fetch warning', e);
          }

          // C. Fetch Admin Ambulances Fleet
          try {
            const adminAmbs = await adminApi.getAmbulances();
            if (adminAmbs && adminAmbs.length > 0) {
              setAmbulances(adminAmbs.map(a => ({
                ...a,
                vehicleNumber: a.vehicle_number,
                type: a.vehicle_type,
                coords: [a.current_location?.lat || 12.9352, a.current_location?.lon || 77.6145],
                currentNodeId: a.current_node_id || 'N1'
              })));
            }
          } catch (e) {
            console.warn('Admin ambulances fetch warning', e);
          }

          // D. Fetch Admin Hospitals
          try {
            const adminHosps = await adminApi.getHospitals();
            if (adminHosps && adminHosps.length > 0) {
              setHospitals(adminHosps.map(h => ({
                ...h,
                coords: [h.coordinate?.lat || 12.9716, h.coordinate?.lon || 77.5946],
                availableEmergencyBeds: h.available_er_beds,
                availableIcuBeds: h.available_icu_beds,
                totalEmergencyBeds: h.total_er_beds,
                totalIcuBeds: h.total_icu_beds,
                hasICU: h.total_icu_beds > 0,
                hasTraumaUnit: h.trauma_level === 1
              })));
            }
          } catch (e) {
            console.warn('Admin hospitals fetch warning', e);
          }

          // E. Fetch Admin Emergencies
          try {
            const adminEmergencies = await adminApi.getEmergencies();
            if (adminEmergencies) {
              setEmergencies(adminEmergencies);
              if (adminEmergencies.length > 0) {
                const active = adminEmergencies.find(e => e.journey_stage !== 'COMPLETED') || adminEmergencies[0];
                if (active) {
                  setActiveJourney({
                    emergencyId: active.id,
                    emergency: active,
                    ambulanceId: active.assigned_ambulance_id,
                    hospitalId: active.destination_hospital_id,
                    stageName: active.journey_stage,
                    pickupRoute: active.stage1_route,
                    hospitalRoute: active.stage2_route
                  });
                }
              }
            }
          } catch (e) {
            console.warn('Admin emergencies fetch warning', e);
          }
        }
      } else {
        // Fallback local storage emergencies if unauthenticated
        const localEmg = storageService.getEmergencies();
        if (localEmg && localEmg.length > 0) setEmergencies(localEmg);
      }

      setNotifications(storageService.getNotifications());
    } catch (err) {
      console.warn('Backend connection notice - using fallback seeds where needed', err);
      setAmbulances(storageService.getAmbulances());
      setHospitals(storageService.getHospitals());
      setStations(storageService.getStations());
      setEmergencies(storageService.getEmergencies());
      setNotifications(storageService.getNotifications());
      setActiveJourney(storageService.getActiveJourney());
    }
  };

  // Add new emergency (Client / Public or Dispatcher)
  const addEmergency = async (formValues) => {
    try {
      const createdIncident = await emergencyApi.create(formValues);

      const journeyState = {
        emergencyId: createdIncident.id,
        emergency: createdIncident,
        ambulanceId: createdIncident.assigned_ambulance_id,
        hospitalId: createdIncident.destination_hospital_id,
        stage: 2,
        stageName: createdIncident.journey_stage || 'STAGE_1_DISPATCH_TO_PATIENT',
        pickupRoute: createdIncident.stage1_route,
        hospitalRoute: createdIncident.stage2_route,
        updatedAt: new Date().toISOString()
      };

      setActiveJourney(journeyState);
      storageService.saveActiveJourney(journeyState);
      setEmergencies(prev => [createdIncident, ...prev]);

      storageService.addNotification({
        title: 'Emergency Dispatched',
        message: `${createdIncident.category} emergency reported. Assigned vehicle: ${createdIncident.assigned_ambulance_id || 'Pending'}.`,
        type: 'emergency',
        link: `/journey-tracking/${createdIncident.id}`
      });
      setNotifications(storageService.getNotifications());

      await refreshAllData();
      return createdIncident;
    } catch (err) {
      console.error('Error submitting emergency to backend:', err);
      return null;
    }
  };

  // Roadblock toggle via backend simulation API
  const toggleRoadBlock = async (uNode, vNode, isBlocked = true, reason = 'Obstacle on route') => {
    try {
      const result = await simulationApi.toggleRoadblock(uNode, vNode, isBlocked, reason);
      if (result.rerouted_incidents && result.rerouted_incidents.length > 0) {
        const updated = result.rerouted_incidents[0];
        if (activeJourney && activeJourney.emergencyId === updated.id) {
          setActiveJourney(prev => ({
            ...prev,
            emergency: updated,
            hospitalRoute: updated.stage2_route || prev.hospitalRoute,
            pickupRoute: updated.stage1_route || prev.pickupRoute
          }));
        }
      }
    } catch (err) {
      console.error('Error toggling roadblock on backend:', err);
    }
    await refreshAllData();
  };

  // Traffic multiplier update
  const setEdgeTrafficMultiplier = async (uNode, vNode, trafficFactor) => {
    try {
      await simulationApi.updateTraffic(uNode, vNode, trafficFactor);
    } catch (err) {
      console.error('Error updating traffic multiplier:', err);
    }
    await refreshAllData();
  };

  // Notifications
  const markNotificationAsRead = (id) => {
    const updated = notifications.map(n => (n.id === id ? { ...n, isRead: true } : n));
    storageService.saveNotifications(updated);
    setNotifications(updated);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    storageService.saveNotifications(updated);
    setNotifications(updated);
  };

  // Real backend authentication
  const loginUser = async (username, password) => {
    try {
      const authData = await authApi.login(username, password);
      setCurrentUser(authData);
      await refreshAllData();
      return { success: true, user: authData };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Invalid username or password';
      return { success: false, error: errorMsg };
    }
  };

  const logoutUser = () => {
    authApi.logout();
    setCurrentUser(null);
    setAdminOverview(null);
    setActiveJourney(null);
  };

  // Reset entire system to backend seed data
  const resetAllData = async () => {
    try {
      await adminApi.resetSystem();
    } catch (err) {
      console.warn('Backend reset notice', err);
    }
    storageService.resetAllData();
    await refreshAllData();
  };

  // Update hospital ICU and ER capacity via admin API
  const updateHospitalBeds = async (hospitalId, availableIcu, availableEr) => {
    try {
      await adminApi.updateHospitalCapacity(hospitalId, availableIcu, availableEr);
    } catch (e) {
      console.warn('Backend capacity update notice', e);
    }
    setHospitals(prev => prev.map(h => {
      if (h.id === hospitalId) {
        return {
          ...h,
          available_icu_beds: availableIcu,
          available_er_beds: availableEr,
          availableIcuBeds: availableIcu,
          availableEmergencyBeds: availableEr
        };
      }
      return h;
    }));
    await refreshAllData();
  };

  const value = {
    ambulances,
    hospitals,
    stations,
    emergencies,
    notifications,
    adminOverview,
    activeJourney,
    currentUser,
    roadGraph,
    blockedEdgeIds,
    trafficMultipliers,
    algorithmPreference,
    setAlgorithmPreference,
    addEmergency,
    updateHospitalBeds,
    toggleRoadBlock,
    setEdgeTrafficMultiplier,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    loginUser,
    logoutUser,
    resetAllData,
    refreshAllData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
