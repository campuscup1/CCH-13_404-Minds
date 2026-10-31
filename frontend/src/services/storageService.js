import { INITIAL_AMBULANCES } from '../data/ambulances';
import { INITIAL_HOSPITALS } from '../data/hospitals';
import { INITIAL_STATIONS } from '../data/stations';
import { INITIAL_EMERGENCIES } from '../data/emergencies';

const STORAGE_KEYS = {
  AMBULANCES: 'mediroute_ambulances_v1',
  HOSPITALS: 'mediroute_hospitals_v1',
  STATIONS: 'mediroute_stations_v1',
  EMERGENCIES: 'mediroute_emergencies_v1',
  NOTIFICATIONS: 'mediroute_notifications_v1',
  ACTIVE_JOURNEY: 'mediroute_active_journey_v1',
  USER_SESSION: 'mediroute_user_session_v1',
  SETTINGS: 'mediroute_settings_v1'
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-01',
    title: 'New Emergency Request Received',
    message: 'Cardiac Emergency reported at Saat Rasta Chowk (EMG-2026-101). Priority: CRITICAL.',
    type: 'emergency',
    isRead: false,
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    link: '/dispatch/EMG-2026-101'
  },
  {
    id: 'NOTIF-02',
    title: 'Ambulance Dispatched',
    message: 'Ambulance AMB-105 assigned to MIDC Industrial incident. ETA: 4.5 mins.',
    type: 'dispatch',
    isRead: false,
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    link: '/route/ambulance/AMB-105'
  },
  {
    id: 'NOTIF-03',
    title: 'Traffic Congestion Detected',
    message: 'Heavy traffic reported near Ashok Chowk corridor. Dynamic rerouting algorithm active.',
    type: 'warning',
    isRead: true,
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    link: '/dynamic-routing'
  }
];

export const storageService = {
  getAmbulances() {
    const data = localStorage.getItem(STORAGE_KEYS.AMBULANCES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.AMBULANCES, JSON.stringify(INITIAL_AMBULANCES));
      return INITIAL_AMBULANCES;
    }
    return JSON.parse(data);
  },

  saveAmbulances(ambulances) {
    localStorage.setItem(STORAGE_KEYS.AMBULANCES, JSON.stringify(ambulances));
  },

  getHospitals() {
    const data = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
      return INITIAL_HOSPITALS;
    }
    return JSON.parse(data);
  },

  saveHospitals(hospitals) {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
  },

  getStations() {
    const data = localStorage.getItem(STORAGE_KEYS.STATIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(INITIAL_STATIONS));
      return INITIAL_STATIONS;
    }
    return JSON.parse(data);
  },

  saveStations(stations) {
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
  },

  getEmergencies() {
    const data = localStorage.getItem(STORAGE_KEYS.EMERGENCIES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.EMERGENCIES, JSON.stringify(INITIAL_EMERGENCIES));
      return INITIAL_EMERGENCIES;
    }
    return JSON.parse(data);
  },

  saveEmergencies(emergencies) {
    localStorage.setItem(STORAGE_KEYS.EMERGENCIES, JSON.stringify(emergencies));
  },

  getNotifications() {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(data);
  },

  saveNotifications(notifications) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  addNotification(notification) {
    const current = this.getNotifications();
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      isRead: false,
      timestamp: new Date().toISOString(),
      ...notification
    };
    const updated = [newNotif, ...current];
    this.saveNotifications(updated);
    return newNotif;
  },

  getActiveJourney() {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_JOURNEY);
    return data ? JSON.parse(data) : null;
  },

  saveActiveJourney(journey) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_JOURNEY, JSON.stringify(journey));
  },

  getUserSession() {
    const data = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!data) {
      // Default demo logged-in admin
      const defaultUser = {
        name: 'Command Center Admin',
        email: 'admin@mediroute.ai',
        role: 'Chief Dispatch Officer',
        station: 'Solapur Central EMS Control'
      };
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(data);
  },

  saveUserSession(session) {
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
  },

  clearUserSession() {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  },

  resetAllData() {
    localStorage.setItem(STORAGE_KEYS.AMBULANCES, JSON.stringify(INITIAL_AMBULANCES));
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(INITIAL_STATIONS));
    localStorage.setItem(STORAGE_KEYS.EMERGENCIES, JSON.stringify(INITIAL_EMERGENCIES));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_JOURNEY);
  }
};
