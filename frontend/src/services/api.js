import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Inject Bearer token from localStorage automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 1. AUTH APIs
export const authApi = {
  async login(username, password) {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      if (response.data?.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user_session', JSON.stringify(response.data));
      }
      return response.data;
    } catch (err) {
      // If backend is unreachable (connection refused), provide fallback demo session so UI remains functional
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        console.warn('Backend server unreachable. Engaging offline fallback demo session.');
        
        let demoRole = 'CLIENT';
        let ambId = null;
        let stnId = 'STN_CENTRAL';

        if (username.toLowerCase() === 'admin' && password === 'admin123') {
          demoRole = 'ADMIN';
        } else if (username.toLowerCase().startsWith('driver') && password === 'driver123') {
          demoRole = 'DRIVER';
          ambId = username === 'driver3' ? 'AMB_ALS_02' : 'AMB_ALS_01';
          stnId = username === 'driver3' ? 'STN_NORTH' : 'STN_CENTRAL';
        } else {
          throw new Error('Invalid username or password. Use demo quick-login.');
        }

        const fallbackUser = {
          access_token: `demo-offline-token-${Date.now()}`,
          token_type: 'bearer',
          role: demoRole,
          user_id: `USR_${username.toUpperCase()}`,
          username: username,
          ambulance_id: ambId,
          station_id: stnId,
          is_offline_demo: true
        };

        localStorage.setItem('access_token', fallbackUser.access_token);
        localStorage.setItem('user_session', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
      throw err;
    }
  },

  async getMe() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch {
      const userStr = localStorage.getItem('user_session');
      return userStr ? JSON.parse(userStr) : null;
    }
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_session');
  }
};

// 2. CLIENT / PUBLIC APIs (No login needed)
export const publicApi = {
  async getMapData() {
    const response = await apiClient.get('/public/map-data');
    return response.data;
  }
};

export const emergencyApi = {
  async create(emergencyData) {
    // Maps frontend form fields to backend EmergencyCreateRequest schema
    const payload = {
      caller_name: emergencyData.caller_name || emergencyData.patientName || 'Emergency Caller',
      caller_phone: emergencyData.caller_phone || emergencyData.contactNumber || '+91-9999999999',
      patient_name: emergencyData.patient_name || emergencyData.patientName || 'Emergency Patient',
      patient_age: emergencyData.patient_age ? Number(emergencyData.patient_age) : (Number(emergencyData.patientAge) || 35),
      category: (emergencyData.category || emergencyData.emergencyType || 'GENERAL').toUpperCase(),
      severity: (emergencyData.severity || emergencyData.priority || 'HIGH').toUpperCase(),
      description: emergencyData.description || 'Emergency medical dispatch required',
      pickup_address: emergencyData.pickup_address || emergencyData.locationName || 'Metropolitan City Corridor',
      pickup_coordinate: {
        lat: Number(emergencyData.latitude || emergencyData.lat || 12.9350),
        lon: Number(emergencyData.longitude || emergencyData.lon || 77.6250)
      }
    };

    // Normalize category to backend enum
    const validCategories = ['CARDIAC', 'TRAUMA', 'RESPIRATORY', 'NEUROLOGICAL', 'PEDIATRIC', 'GENERAL'];
    if (!validCategories.includes(payload.category)) {
      if (payload.category.includes('CARDIAC') || payload.category.includes('HEART')) payload.category = 'CARDIAC';
      else if (payload.category.includes('ACCIDENT') || payload.category.includes('TRAUMA')) payload.category = 'TRAUMA';
      else if (payload.category.includes('BREATH') || payload.category.includes('RESPIRATORY')) payload.category = 'RESPIRATORY';
      else if (payload.category.includes('CHILD') || payload.category.includes('PEDIATRIC')) payload.category = 'PEDIATRIC';
      else if (payload.category.includes('STROKE') || payload.category.includes('NEURO')) payload.category = 'NEUROLOGICAL';
      else payload.category = 'GENERAL';
    }

    // Normalize severity to backend enum
    const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    if (!validSeverities.includes(payload.severity)) {
      payload.severity = 'HIGH';
    }

    const response = await apiClient.post('/emergency/request', payload);
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/emergency/${id}`);
    return response.data;
  },

  async getAll() {
    // If logged in as admin, fetch from /admin/emergencies
    try {
      const response = await apiClient.get('/admin/emergencies');
      return response.data;
    } catch {
      return [];
    }
  }
};

// 3. DRIVER APIs (Driver login required)
export const driverApi = {
  async getMyDispatch() {
    const response = await apiClient.get('/driver/my-dispatch');
    return response.data;
  },

  async updateStatus(status, note = null) {
    const response = await apiClient.post('/driver/status', { status, note });
    return response.data;
  },

  async updateLocation(coordinate, speedKmh = null) {
    const response = await apiClient.post('/driver/location', {
      current_coordinate: coordinate,
      speed_kmh: speedKmh
    });
    return response.data;
  }
};

// 4. ADMIN APIs (Admin login required)
export const adminApi = {
  async getOverview() {
    const response = await apiClient.get('/admin/overview');
    return response.data;
  },

  async getStations() {
    const response = await apiClient.get('/admin/stations');
    return response.data;
  },

  async getAmbulances() {
    const response = await apiClient.get('/admin/ambulances');
    return response.data;
  },

  async getEmergencies() {
    const response = await apiClient.get('/admin/emergencies');
    return response.data;
  },

  async getHospitals() {
    const response = await apiClient.get('/admin/hospitals');
    return response.data;
  },

  async updateHospitalCapacity(hospitalId, availableIcuBeds, availableErBeds) {
    const response = await apiClient.put(
      `/admin/hospitals/${hospitalId}/capacity?available_icu_beds=${availableIcuBeds}&available_er_beds=${availableErBeds}`
    );
    return response.data;
  },

  async resetSystem() {
    const response = await apiClient.post('/admin/system/reset');
    return response.data;
  }
};

// 5. SIMULATION APIs (Roadblocks & Congestion)
export const simulationApi = {
  async toggleRoadblock(uNode, vNode, isBlocked, reason = 'Obstruction on route') {
    const response = await apiClient.post('/simulate/roadblock', {
      u_node: uNode,
      v_node: vNode,
      is_blocked: isBlocked,
      reason: reason
    });
    return response.data;
  },

  async updateTraffic(uNode, vNode, trafficFactor) {
    const response = await apiClient.post('/simulate/traffic', {
      u_node: uNode,
      v_node: vNode,
      traffic_factor: trafficFactor
    });
    return response.data;
  }
};

// Backward-compatible alias for existing components
export const ambulanceApi = {
  async getAll() {
    try {
      return await adminApi.getAmbulances();
    } catch {
      const mapData = await publicApi.getMapData();
      return mapData.ambulances || [];
    }
  },
  async updateStatus(id, status, extra = {}) {
    try {
      return await driverApi.updateStatus(status);
    } catch {
      return null;
    }
  }
};

export const hospitalApi = {
  async getAll() {
    try {
      return await adminApi.getHospitals();
    } catch {
      const mapData = await publicApi.getMapData();
      return mapData.hospitals || [];
    }
  },
  async updateBeds(id, icu, er) {
    return await adminApi.updateHospitalCapacity(id, icu, er);
  }
};

export const stationApi = {
  async getAll() {
    try {
      return await adminApi.getStations();
    } catch {
      const mapData = await publicApi.getMapData();
      return mapData.stations || [];
    }
  }
};
