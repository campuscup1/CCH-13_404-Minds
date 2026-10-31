import { ROAD_NODES } from '../data/roadNetwork';

/**
 * Calculates the great-circle distance between two points on the Earth (Haversine formula in km).
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Finds the nearest graph node in the Solapur road network to a given coordinate [lat, lng].
 */
export function findNearestNode([lat, lng]) {
  let nearestNodeId = null;
  let minDistance = Infinity;

  Object.entries(ROAD_NODES).forEach(([id, node]) => {
    const dist = haversineDistance(lat, lng, node.coords[0], node.coords[1]);
    if (dist < minDistance) {
      minDistance = dist;
      nearestNodeId = id;
    }
  });

  return {
    nodeId: nearestNodeId,
    node: ROAD_NODES[nearestNodeId],
    distanceKm: minDistance
  };
}

/**
 * Format duration in minutes into a clean readable string (e.g., "6.5 mins" or "1 hr 4 mins").
 */
export function formatMinutes(minutes) {
  if (minutes == null || isNaN(minutes)) return '--';
  const rounded = Math.round(minutes * 10) / 10;
  if (rounded < 60) {
    return `${rounded} min${rounded === 1 ? '' : 's'}`;
  }
  const hrs = Math.floor(rounded / 60);
  const mins = Math.round(rounded % 60);
  return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins === 1 ? '' : 's'}`;
}

/**
 * Calculates straight line distance in km between two lat/lng arrays.
 */
export function coordsDistance(c1, c2) {
  if (!c1 || !c2) return 0;
  return haversineDistance(c1[0], c1[1], c2[0], c2[1]);
}
