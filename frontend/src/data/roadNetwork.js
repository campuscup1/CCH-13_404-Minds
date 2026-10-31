/**
 * Solapur, Maharashtra Realistic Road Network
 * Coordinates centered around Solapur City (~17.6599° N, 75.9064° E)
 * Includes key road intersections, hospitals, and ambulance stations
 */

export const SOLAPUR_CENTER = [17.6650, 75.9080];

export const ROAD_NODES = {
  N_CIVIL: {
    id: 'N_CIVIL',
    name: 'Civil Hospital Depot / Station Rd',
    coords: [17.6715, 75.9102],
    landmark: 'Chhatrapati Shivaji Maharaj Sarvopchar Rugnalaya'
  },
  N_SAAT_RASTA: {
    id: 'N_SAAT_RASTA',
    name: 'Saat Rasta Chowk',
    coords: [17.6650, 75.9080],
    landmark: 'Central 7-Way Intersection'
  },
  N_ASHOK_CHOWK: {
    id: 'N_ASHOK_CHOWK',
    name: 'Ashok Chowk',
    coords: [17.6580, 75.9210],
    landmark: 'East Solapur Hub'
  },
  N_STATION_RD: {
    id: 'N_STATION_RD',
    name: 'Solapur Railway Station Junction',
    coords: [17.6690, 75.9020],
    landmark: 'Central Railway Hub'
  },
  N_MIDC: {
    id: 'N_MIDC',
    name: 'MIDC Industrial Area',
    coords: [17.6430, 75.9320],
    landmark: 'Akkalkot Road Industrial Zone'
  },
  N_VIJAPUR_RD: {
    id: 'N_VIJAPUR_RD',
    name: 'Vijapur Road / Jule Solapur',
    coords: [17.6380, 75.9010],
    landmark: 'South Suburban Residential Sector'
  },
  N_HOTGI_RD: {
    id: 'N_HOTGI_RD',
    name: 'Hotgi Road Junction',
    coords: [17.6450, 75.9180],
    landmark: 'Airport & Hotgi Link Road'
  },
  N_PUNE_NAKA: {
    id: 'N_PUNE_NAKA',
    name: 'Pune Naka Chowk',
    coords: [17.6850, 75.8940],
    landmark: 'North-West Highway Gateway'
  },
  N_OLD_PUNE_NAKA: {
    id: 'N_OLD_PUNE_NAKA',
    name: 'Old Pune Naka',
    coords: [17.6790, 75.8990],
    landmark: 'Old Highway Junction'
  },
  N_PARK_STADIUM: {
    id: 'N_PARK_STADIUM',
    name: 'Park Stadium Chowk',
    coords: [17.6680, 75.9160],
    landmark: 'Indira Gandhi Stadium'
  },
  N_KUMBHAR_VES: {
    id: 'N_KUMBHAR_VES',
    name: 'Kumbhar Ves / City Market',
    coords: [17.6750, 75.9190],
    landmark: 'Historic Old City Gate'
  },
  N_RANG_BHAVAN: {
    id: 'N_RANG_BHAVAN',
    name: 'Rang Bhavan Chowk',
    coords: [17.6610, 75.9050],
    landmark: 'Cultural Center & South Link'
  },
  N_DHOBI_GHAT: {
    id: 'N_DHOBI_GHAT',
    name: 'Dhobi Ghat Junction',
    coords: [17.6520, 75.9120],
    landmark: 'Midtown Connector'
  },
  N_KASSA_PET: {
    id: 'N_KASSA_PET',
    name: 'Kassa Peth Crossroads',
    coords: [17.6630, 75.9260],
    landmark: 'East Suburban Link'
  },
  N_BHAVANI_PETH: {
    id: 'N_BHAVANI_PETH',
    name: 'Bhavani Peth Square',
    coords: [17.6550, 75.9280],
    landmark: 'Commercial & Transport Corridor'
  },
  N_SHELGI: {
    id: 'N_SHELGI',
    name: 'Shelgi Naka / Ring Bypass',
    coords: [17.6910, 75.9250],
    landmark: 'North Bypass Ring Road'
  },
  N_DUMAR_CHOWK: {
    id: 'N_DUMAR_CHOWK',
    name: 'Dumar Chowk / West Ring',
    coords: [17.6490, 75.8930],
    landmark: 'Western Ring Connector'
  }
};

/**
 * Road Edges with realistic distances (km), estimated baseline travel times (minutes),
 * road names, and realistic road coordinates for map polylines.
 */
export const ROAD_EDGES = [
  {
    id: 'E_PUNE_OLD_PUNE',
    from: 'N_PUNE_NAKA',
    to: 'N_OLD_PUNE_NAKA',
    distanceKm: 0.8,
    baseTimeMinutes: 2,
    roadName: 'Old NH65 Pune Highway',
    coords: [[17.6850, 75.8940], [17.6820, 75.8965], [17.6790, 75.8990]]
  },
  {
    id: 'E_OLD_PUNE_STATION',
    from: 'N_OLD_PUNE_NAKA',
    to: 'N_STATION_RD',
    distanceKm: 1.2,
    baseTimeMinutes: 3,
    roadName: 'Station Link Road',
    coords: [[17.6790, 75.8990], [17.6740, 75.9005], [17.6690, 75.9020]]
  },
  {
    id: 'E_OLD_PUNE_CIVIL',
    from: 'N_OLD_PUNE_NAKA',
    to: 'N_CIVIL',
    distanceKm: 1.5,
    baseTimeMinutes: 4,
    roadName: 'Civil Hospital Main Arterial',
    coords: [[17.6790, 75.8990], [17.6760, 75.9045], [17.6715, 75.9102]]
  },
  {
    id: 'E_STATION_SAAT_RASTA',
    from: 'N_STATION_RD',
    to: 'N_SAAT_RASTA',
    distanceKm: 0.9,
    baseTimeMinutes: 2.5,
    roadName: 'Dr. Ambedkar Road',
    coords: [[17.6690, 75.9020], [17.6670, 75.9050], [17.6650, 75.9080]]
  },
  {
    id: 'E_CIVIL_SAAT_RASTA',
    from: 'N_CIVIL',
    to: 'N_SAAT_RASTA',
    distanceKm: 0.8,
    baseTimeMinutes: 2,
    roadName: 'Hospital Boulevard',
    coords: [[17.6715, 75.9102], [17.6685, 75.9090], [17.6650, 75.9080]]
  },
  {
    id: 'E_CIVIL_PARK',
    from: 'N_CIVIL',
    to: 'N_PARK_STADIUM',
    distanceKm: 0.7,
    baseTimeMinutes: 2,
    roadName: 'Stadium Avenue',
    coords: [[17.6715, 75.9102], [17.6700, 75.9130], [17.6680, 75.9160]]
  },
  {
    id: 'E_CIVIL_KUMBHAR',
    from: 'N_CIVIL',
    to: 'N_KUMBHAR_VES',
    distanceKm: 1.1,
    baseTimeMinutes: 3,
    roadName: 'Market Arterial',
    coords: [[17.6715, 75.9102], [17.6735, 75.9145], [17.6750, 75.9190]]
  },
  {
    id: 'E_PUNE_SHELGI',
    from: 'N_PUNE_NAKA',
    to: 'N_SHELGI',
    distanceKm: 3.4,
    baseTimeMinutes: 6,
    roadName: 'North Ring Bypass',
    coords: [[17.6850, 75.8940], [17.6890, 75.9080], [17.6910, 75.9250]]
  },
  {
    id: 'E_SHELGI_KUMBHAR',
    from: 'N_SHELGI',
    to: 'N_KUMBHAR_VES',
    distanceKm: 1.9,
    baseTimeMinutes: 4.5,
    roadName: 'Shelgi City Road',
    coords: [[17.6910, 75.9250], [17.6830, 75.9220], [17.6750, 75.9190]]
  },
  {
    id: 'E_SAAT_RASTA_RANG',
    from: 'N_SAAT_RASTA',
    to: 'N_RANG_BHAVAN',
    distanceKm: 0.6,
    baseTimeMinutes: 1.5,
    roadName: 'Rang Bhavan Link',
    coords: [[17.6650, 75.9080], [17.6630, 75.9065], [17.6610, 75.9050]]
  },
  {
    id: 'E_SAAT_RASTA_PARK',
    from: 'N_SAAT_RASTA',
    to: 'N_PARK_STADIUM',
    distanceKm: 0.9,
    baseTimeMinutes: 2.5,
    roadName: 'Subhash Road',
    coords: [[17.6650, 75.9080], [17.6665, 75.9120], [17.6680, 75.9160]]
  },
  {
    id: 'E_PARK_KASSA',
    from: 'N_PARK_STADIUM',
    to: 'N_KASSA_PET',
    distanceKm: 1.2,
    baseTimeMinutes: 3,
    roadName: 'East Link Expressway',
    coords: [[17.6680, 75.9160], [17.6655, 75.9210], [17.6630, 75.9260]]
  },
  {
    id: 'E_KUMBHAR_KASSA',
    from: 'N_KUMBHAR_VES',
    to: 'N_KASSA_PET',
    distanceKm: 1.5,
    baseTimeMinutes: 3.5,
    roadName: 'Kumbhar-Kassa Road',
    coords: [[17.6750, 75.9190], [17.6690, 75.9225], [17.6630, 75.9260]]
  },
  {
    id: 'E_RANG_DHOBI',
    from: 'N_RANG_BHAVAN',
    to: 'N_DHOBI_GHAT',
    distanceKm: 1.2,
    baseTimeMinutes: 3,
    roadName: 'South Central Road',
    coords: [[17.6610, 75.9050], [17.6565, 75.9085], [17.6520, 75.9120]]
  },
  {
    id: 'E_RANG_DUMAR',
    from: 'N_RANG_BHAVAN',
    to: 'N_DUMAR_CHOWK',
    distanceKm: 1.8,
    baseTimeMinutes: 4,
    roadName: 'West Ring Road',
    coords: [[17.6610, 75.9050], [17.6550, 75.8990], [17.6490, 75.8930]]
  },
  {
    id: 'E_DUMAR_VIJAPUR',
    from: 'N_DUMAR_CHOWK',
    to: 'N_VIJAPUR_RD',
    distanceKm: 1.5,
    baseTimeMinutes: 3.5,
    roadName: 'Jule Solapur West Bypass',
    coords: [[17.6490, 75.8930], [17.6435, 75.8970], [17.6380, 75.9010]]
  },
  {
    id: 'E_DHOBI_VIJAPUR',
    from: 'N_DHOBI_GHAT',
    to: 'N_VIJAPUR_RD',
    distanceKm: 1.9,
    baseTimeMinutes: 4.5,
    roadName: 'Vijapur Main Road',
    coords: [[17.6520, 75.9120], [17.6450, 75.9065], [17.6380, 75.9010]]
  },
  {
    id: 'E_DHOBI_HOTGI',
    from: 'N_DHOBI_GHAT',
    to: 'N_HOTGI_RD',
    distanceKm: 1.0,
    baseTimeMinutes: 2.5,
    roadName: 'Airport Link Road',
    coords: [[17.6520, 75.9120], [17.6485, 75.9150], [17.6450, 75.9180]]
  },
  {
    id: 'E_DHOBI_ASHOK',
    from: 'N_DHOBI_GHAT',
    to: 'N_ASHOK_CHOWK',
    distanceKm: 1.1,
    baseTimeMinutes: 2.5,
    roadName: 'Ashok Road Corridor',
    coords: [[17.6520, 75.9120], [17.6550, 75.9165], [17.6580, 75.9210]]
  },
  {
    id: 'E_KASSA_BHAVANI',
    from: 'N_KASSA_PET',
    to: 'N_BHAVANI_PETH',
    distanceKm: 0.9,
    baseTimeMinutes: 2,
    roadName: 'Bhavani Peth Road',
    coords: [[17.6630, 75.9260], [17.6590, 75.9270], [17.6550, 75.9280]]
  },
  {
    id: 'E_BHAVANI_ASHOK',
    from: 'N_BHAVANI_PETH',
    to: 'N_ASHOK_CHOWK',
    distanceKm: 0.8,
    baseTimeMinutes: 2,
    roadName: 'Market Link',
    coords: [[17.6550, 75.9280], [17.6565, 75.9245], [17.6580, 75.9210]]
  },
  {
    id: 'E_ASHOK_HOTGI',
    from: 'N_ASHOK_CHOWK',
    to: 'N_HOTGI_RD',
    distanceKm: 1.5,
    baseTimeMinutes: 3.5,
    roadName: 'Hotgi Connecting Road',
    coords: [[17.6580, 75.9210], [17.6515, 75.9195], [17.6450, 75.9180]]
  },
  {
    id: 'E_ASHOK_MIDC',
    from: 'N_ASHOK_CHOWK',
    to: 'N_MIDC',
    distanceKm: 2.0,
    baseTimeMinutes: 4.5,
    roadName: 'Akkalkot Highway / MIDC Way',
    coords: [[17.6580, 75.9210], [17.6505, 75.9265], [17.6430, 75.9320]]
  },
  {
    id: 'E_HOTGI_MIDC',
    from: 'N_HOTGI_RD',
    to: 'N_MIDC',
    distanceKm: 1.6,
    baseTimeMinutes: 3.5,
    roadName: 'Industrial Corridor Link',
    coords: [[17.6450, 75.9180], [17.6440, 75.9250], [17.6430, 75.9320]]
  },
  {
    id: 'E_VIJAPUR_HOTGI',
    from: 'N_VIJAPUR_RD',
    to: 'N_HOTGI_RD',
    distanceKm: 1.9,
    baseTimeMinutes: 4,
    roadName: 'South Belt Ring',
    coords: [[17.6380, 75.9010], [17.6415, 75.9095], [17.6450, 75.9180]]
  }
];

/**
 * Builds an undirected adjacency graph from the road edges.
 * blockedEdgeIds: Set of edge IDs that are temporarily impassable.
 * trafficMultipliers: Map of edgeId -> weight multiplier (e.g. 2.5 for heavy traffic).
 */
export function buildGraph(blockedEdgeIds = new Set(), trafficMultipliers = {}) {
  const graph = {};

  // Initialize nodes
  Object.keys(ROAD_NODES).forEach(nodeId => {
    graph[nodeId] = [];
  });

  ROAD_EDGES.forEach(edge => {
    if (blockedEdgeIds.has(edge.id)) {
      return; // Skip blocked road edge
    }

    const multiplier = trafficMultipliers[edge.id] || 1;
    const travelTime = edge.baseTimeMinutes * multiplier;
    const distance = edge.distanceKm;

    graph[edge.from].push({
      to: edge.to,
      edgeId: edge.id,
      distanceKm: distance,
      travelTimeMinutes: travelTime,
      baseTimeMinutes: edge.baseTimeMinutes,
      roadName: edge.roadName,
      coords: edge.coords
    });

    graph[edge.to].push({
      to: edge.from,
      edgeId: edge.id,
      distanceKm: distance,
      travelTimeMinutes: travelTime,
      baseTimeMinutes: edge.baseTimeMinutes,
      roadName: edge.roadName,
      coords: [...edge.coords].reverse()
    });
  });

  return graph;
}
