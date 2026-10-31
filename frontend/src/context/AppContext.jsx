import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import {
  authApi,
  publicApi,
  emergencyApi,
  driverApi,
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
  const [roadGraph, setRoadGraph] = useState({ nodes: [], edges: [] });
  const [drivers, setDrivers] = useState(() => {
    const saved = localStorage.getItem('mediroute_drivers_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return [
      { id: 'DRV_01', name: 'Suresh Patil', phone: '+91-98220-11221', stationId: 'STN_CENTRAL', stationName: 'Central Station 01', assignedAmbulance: 'AMB_ALS_01', status: 'ON_DUTY', shift: 'Day (08:00 - 20:00)' },
      { id: 'DRV_02', name: 'Rajesh Shinde', phone: '+91-98220-33442', stationId: 'STN_CENTRAL', stationName: 'Central Station 01', assignedAmbulance: 'AMB_BLS_01', status: 'ON_DUTY', shift: 'Day (08:00 - 20:00)' },
      { id: 'DRV_03', name: 'Amit Kulkarni', phone: '+91-98220-55663', stationId: 'STN_NORTH', stationName: 'North Ring Station 02', assignedAmbulance: 'AMB_ALS_02', status: 'STANDBY', shift: 'Night (20:00 - 08:00)' },
      { id: 'DRV_04', name: 'Vikram Deshmukh', phone: '+91-98220-77884', stationId: 'STN_NORTH', stationName: 'North Ring Station 02', assignedAmbulance: 'AMB_BLS_02', status: 'ON_DUTY', shift: 'Day (08:00 - 20:00)' }
    ];
  });

  // Road graph dynamic conditions
  const [blockedEdgeIds, setBlockedEdgeIds] = useState(new Set());
  const [trafficMultipliers, setTrafficMultipliers] = useState({});
  const [algorithmPreference, setAlgorithmPreference] = useState('Bidirectional A*');

  // Load user session and backend data on mount
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
      // 1. Fetch public map data (Nodes, Edges, Stations, Hospitals, Ambulances)
      const mapData = await publicApi.getMapData();
      if (mapData) {
        if (mapData.stations) {
          // Normalize coordinates
          const normalizedStations = mapData.stations.map(s => ({
            ...s,
            coords: [s.coordinate.lat, s.coordinate.lon]
          }));
          setStations(normalizedStations);
        }

        if (mapData.hospitals) {
          const normalizedHospitals = mapData.hospitals.map(h => ({
            ...h,
            coords: [h.coordinate.lat, h.coordinate.lon],
            availableEmergencyBeds: h.available_er_beds,
            availableIcuBeds: h.available_icu_beds,
            totalEmergencyBeds: h.total_er_beds,
            totalIcuBeds: h.total_icu_beds,
            hasICU: h.total_icu_beds > 0,
            hasTraumaUnit: h.trauma_level === 1
          }));
          setHospitals(normalizedHospitals);
        }

        if (mapData.ambulances) {
          const normalizedAmbulances = mapData.ambulances.map(a => ({
            ...a,
            vehicleNumber: a.vehicle_number,
            type: a.vehicle_type,
            coords: [a.current_location.lat, a.current_location.lon],
            currentNodeId: a.current_node_id || 'N1'
          }));
          setAmbulances(normalizedAmbulances);
        }

        if (mapData.nodes && mapData.edges) {
          setRoadGraph({ nodes: mapData.nodes, edges: mapData.edges });
          // Sync blocked edges
          const blocked = new Set();
          mapData.edges.forEach(e => {
            if (e.is_blocked) blocked.add(`${e.u}-${e.v}`);
          });
          setBlockedEdgeIds(blocked);
        }
      }

      // 2. Fetch role-specific data if authenticated
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user_session');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') {
          const adminEmergencies = await adminApi.getEmergencies();
          if (adminEmergencies && adminEmergencies.length > 0) {
            setEmergencies(adminEmergencies);
          }
        } else if (user.role === 'DRIVER') {
          const dispatch = await driverApi.getMyDispatch();
          if (dispatch?.active_emergency) {
            setActiveJourney({
              emergencyId: dispatch.active_emergency.id,
              emergency: dispatch.active_emergency,
              ambulanceId: dispatch.ambulance?.id,
              ambulance: dispatch.ambulance,
              stageName: dispatch.active_emergency.journey_stage,
              pickupRoute: dispatch.active_emergency.stage1_route,
              hospitalRoute: dispatch.active_emergency.stage2_route
            });
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
      // Graceful fallback to storageService
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
      // Direct call to backend emergency intake & dispatch
      const createdIncident = await emergencyApi.create(formValues);

      // Create journey state from backend response
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

      // Update emergency list
      setEmergencies(prev => [createdIncident, ...prev]);

      // Notification
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
      // Fallback
      return null;
    }
  };

  // Driver confirms patient pickup
  const confirmPatientPickup = async (emergencyId) => {
    try {
      const response = await driverApi.updateStatus('PICKUP_CONFIRMED');
      if (response && response.emergency) {
        const updatedInc = response.emergency;
        const journey = {
          emergencyId: updatedInc.id,
          emergency: updatedInc,
          ambulanceId: updatedInc.assigned_ambulance_id,
          hospitalId: updatedInc.destination_hospital_id,
          stage: 5,
          stageName: 'PICKUP_CONFIRMED - Stage 2 Route to Hospital Active',
          pickupRoute: updatedInc.stage1_route,
          hospitalRoute: updatedInc.stage2_route,
          recommendations: updatedInc.hospital_recommendations
        };
        setActiveJourney(journey);
        storageService.saveActiveJourney(journey);
      }
    } catch (err) {
      console.error('Error updating pickup status:', err);
    }
    await refreshAllData();
  };

  // Complete journey upon hospital arrival
  const completeActiveJourney = async (emergencyId) => {
    try {
      await driverApi.updateStatus('ARRIVED_AT_HOSPITAL');
      if (activeJourney) {
        const completed = {
          ...activeJourney,
          stage: 9,
          stageName: 'COMPLETED - Patient Admitted',
          isCompleted: true
        };
        setActiveJourney(completed);
        storageService.saveActiveJourney(completed);
      }
    } catch (err) {
      console.error('Error completing journey:', err);
    }
    await refreshAllData();
  };

  // Roadblock toggle (Simulates dynamic roadblock via backend API)
  const toggleRoadBlock = async (uNode, vNode, isBlocked = true, reason = 'Obstacle on route') => {
    try {
      const result = await simulationApi.toggleRoadblock(uNode, vNode, isBlocked, reason);
      if (result.rerouted_incidents && result.rerouted_incidents.length > 0) {
        // If the active emergency was rerouted, refresh it immediately
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
      const errorMsg = err.response?.data?.detail || 'Invalid username or password';
      return { success: false, error: errorMsg };
    }
  };

  const logoutUser = () => {
    authApi.logout();
    setCurrentUser(null);
    setActiveJourney(null);
  };

  const resetAllData = async () => {
    try {
      await adminApi.resetSystem();
    } catch (err) {
      console.warn('Backend reset failed, resetting local store', err);
    }
    storageService.resetAllData();
    await refreshAllData();
  };

  const addDriver = (driverData) => {
    const newDriver = {
      id: `DRV_${Date.now().toString().slice(-4)}`,
      name: driverData.name,
      phone: driverData.phone || '+91-98220-99000',
      stationId: driverData.stationId || 'STN_CENTRAL',
      stationName: driverData.stationName || 'Central Station 01',
      assignedAmbulance: driverData.assignedAmbulance || 'Unassigned',
      status: driverData.status || 'ON_DUTY',
      shift: driverData.shift || 'Day (08:00 - 20:00)'
    };
    const updated = [newDriver, ...drivers];
    setDrivers(updated);
    localStorage.setItem('mediroute_drivers_v1', JSON.stringify(updated));
    return newDriver;
  };

  const removeDriver = (driverId) => {
    const updated = drivers.filter(d => d.id !== driverId);
    setDrivers(updated);
    localStorage.setItem('mediroute_drivers_v1', JSON.stringify(updated));
  };

  const addAmbulance = (ambData) => {
    const newAmb = {
      id: `AMB_${Date.now().toString().slice(-4)}`,
      vehicleNumber: ambData.vehicleNumber,
      vehicle_number: ambData.vehicleNumber,
      type: ambData.type || 'ALS',
      vehicle_type: ambData.type || 'ALS',
      status: 'AVAILABLE',
      station_id: ambData.stationId || 'STN_CENTRAL',
      stationName: ambData.stationName || 'Central Emergency Station 01',
      assigned_driver_id: ambData.driverId || null,
      currentNodeId: ambData.currentNodeId || 'N1',
      locationName: ambData.locationName || 'Central Emergency Station (N1)',
      equipment: ambData.type === 'ALS' ? ['Ventilator', 'Defibrillator', 'Oxygen'] : ['Oxygen', 'Stretcher', 'Paramedic Kit'],
      coords: [12.9352, 77.6145]
    };
    const updated = [newAmb, ...ambulances];
    setAmbulances(updated);
    return newAmb;
  };

  const removeAmbulance = (ambulanceId) => {
    const updated = ambulances.filter(a => a.id !== ambulanceId);
    setAmbulances(updated);
  };

  const updateAmbulanceStatus = (ambulanceId, newStatus) => {
    const updated = ambulances.map(a => (a.id === ambulanceId ? { ...a, status: newStatus } : a));
    setAmbulances(updated);
  };

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
  };

  const value = {
    ambulances,
    hospitals,
    stations,
    emergencies,
    notifications,
    drivers,
    addDriver,
    removeDriver,
    addAmbulance,
    removeAmbulance,
    updateAmbulanceStatus,
    updateHospitalBeds,
    activeJourney,
    currentUser,
    roadGraph,
    blockedEdgeIds,
    trafficMultipliers,
    algorithmPreference,
    setAlgorithmPreference,
    addEmergency,
    confirmPatientPickup,
    completeActiveJourney,
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
