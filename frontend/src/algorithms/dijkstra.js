import { ROAD_NODES, buildGraph } from '../data/roadNetwork';

/**
 * Dijkstra's Shortest Path Algorithm
 * Calculates the minimum travel-time or distance path on the Solapur road network graph.
 *
 * @param {string} startNodeId - Origin graph node ID
 * @param {string} targetNodeId - Destination graph node ID
 * @param {Object} options - Configuration options
 * @param {string} options.weightMetric - 'travelTime' (default) or 'distance'
 * @param {Set<string>} options.blockedEdgeIds - Set of blocked road edge IDs
 * @param {Object} options.trafficMultipliers - Map of edgeId -> congestion multiplier
 * @returns {Object} Route result with path, distance, time, polyline coords, and step instructions
 */
export function findShortestPathDijkstra(startNodeId, targetNodeId, options = {}) {
  const {
    weightMetric = 'travelTime',
    blockedEdgeIds = new Set(),
    trafficMultipliers = {}
  } = options;

  if (!ROAD_NODES[startNodeId] || !ROAD_NODES[targetNodeId]) {
    return {
      success: false,
      error: `Invalid nodes provided: start=${startNodeId}, target=${targetNodeId}`,
      path: [],
      pathNodes: [],
      coords: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0
    };
  }

  if (startNodeId === targetNodeId) {
    const node = ROAD_NODES[startNodeId];
    return {
      success: true,
      path: [startNodeId],
      pathNodes: [node],
      coords: [node.coords],
      segments: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0
    };
  }

  // 1. Build active road graph considering blocked edges and traffic
  const graph = buildGraph(blockedEdgeIds, trafficMultipliers);

  // 2. Initialize Dijkstra structures
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(ROAD_NODES));

  Object.keys(ROAD_NODES).forEach(nodeId => {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  });

  distances[startNodeId] = 0;

  // 3. Dijkstra relaxation loop
  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let currentNodeId = null;
    let minDistance = Infinity;

    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNodeId = nodeId;
      }
    });

    // If unreachable or target reached
    if (currentNodeId === null || minDistance === Infinity) {
      break; // No valid path to remaining nodes
    }

    if (currentNodeId === targetNodeId) {
      break; // Shortest path to target found!
    }

    unvisited.delete(currentNodeId);

    // Examine neighbors
    const neighbors = graph[currentNodeId] || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.to)) continue;

      const edgeWeight = weightMetric === 'distance' ? edge.distanceKm : edge.travelTimeMinutes;
      const alt = distances[currentNodeId] + edgeWeight;

      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        previous[edge.to] = {
          fromNodeId: currentNodeId,
          edge
        };
      }
    }
  }

  // Check if target was reached
  if (distances[targetNodeId] === Infinity || !previous[targetNodeId]) {
    return {
      success: false,
      error: 'No valid route exists between the selected nodes due to roadblocks or disconnection.',
      path: [],
      pathNodes: [],
      coords: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0
    };
  }

  // 4. Reconstruct the path backwards
  const pathNodeIds = [];
  const segments = [];
  let curr = targetNodeId;

  while (curr !== startNodeId) {
    pathNodeIds.unshift(curr);
    const prevInfo = previous[curr];
    if (!prevInfo) break;
    segments.unshift(prevInfo.edge);
    curr = prevInfo.fromNodeId;
  }
  pathNodeIds.unshift(startNodeId);

  // 5. Compile path metrics and high-resolution polyline coordinates
  let totalDistanceKm = 0;
  let totalTimeMinutes = 0;
  const polylineCoords = [];

  segments.forEach((seg, idx) => {
    totalDistanceKm += seg.distanceKm;
    totalTimeMinutes += seg.travelTimeMinutes;

    // Append road coords, avoiding duplicate consecutive points
    if (idx === 0) {
      polylineCoords.push(...seg.coords);
    } else {
      polylineCoords.push(...seg.coords.slice(1));
    }
  });

  return {
    success: true,
    algorithm: 'Dijkstra',
    path: pathNodeIds,
    pathNodes: pathNodeIds.map(id => ROAD_NODES[id]),
    segments,
    coords: polylineCoords.length > 0 ? polylineCoords : pathNodeIds.map(id => ROAD_NODES[id].coords),
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalTimeMinutes: Math.round(totalTimeMinutes * 10) / 10,
    cost: distances[targetNodeId]
  };
}
