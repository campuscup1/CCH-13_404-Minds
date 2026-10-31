import { ROAD_NODES, buildGraph } from '../data/roadNetwork';
import { haversineDistance } from '../utils/calculations';

/**
 * A* Search Algorithm
 * Uses admissible heuristic h(n) = distance(n, goal) / maxAssumedSpeed for travel time
 * or h(n) = distance(n, goal) for distance metric.
 *
 * @param {string} startNodeId
 * @param {string} targetNodeId
 * @param {Object} options
 * @returns {Object} Route result
 */
export function findShortestPathAStar(startNodeId, targetNodeId, options = {}) {
  const {
    weightMetric = 'travelTime',
    blockedEdgeIds = new Set(),
    trafficMultipliers = {}
  } = options;

  if (!ROAD_NODES[startNodeId] || !ROAD_NODES[targetNodeId]) {
    return {
      success: false,
      error: `Invalid nodes provided: start=${startNodeId}, target=${targetNodeId}`
    };
  }

  const targetCoords = ROAD_NODES[targetNodeId].coords;
  const graph = buildGraph(blockedEdgeIds, trafficMultipliers);

  // Admissible heuristic function
  const heuristic = (nodeId) => {
    const nodeCoords = ROAD_NODES[nodeId].coords;
    const straightDistKm = haversineDistance(
      nodeCoords[0],
      nodeCoords[1],
      targetCoords[0],
      targetCoords[1]
    );

    if (weightMetric === 'distance') {
      return straightDistKm;
    }
    // Max assumed emergency speed = 60 km/h = 1 km per minute
    // So minimum time cannot be lower than straightDistKm / 1.0 minutes
    return straightDistKm / 1.0;
  };

  const openSet = new Set([startNodeId]);
  const cameFrom = {};

  const gScore = {};
  const fScore = {};

  Object.keys(ROAD_NODES).forEach(nodeId => {
    gScore[nodeId] = Infinity;
    fScore[nodeId] = Infinity;
  });

  gScore[startNodeId] = 0;
  fScore[startNodeId] = heuristic(startNodeId);

  while (openSet.size > 0) {
    // Current is the node in openSet with lowest fScore
    let current = null;
    let lowestF = Infinity;

    openSet.forEach(nodeId => {
      if (fScore[nodeId] < lowestF) {
        lowestF = fScore[nodeId];
        current = nodeId;
      }
    });

    if (current === targetNodeId) {
      // Reconstruct path
      const pathNodeIds = [];
      const segments = [];
      let curr = targetNodeId;

      while (curr !== startNodeId) {
        pathNodeIds.unshift(curr);
        const prevInfo = cameFrom[curr];
        if (!prevInfo) break;
        segments.unshift(prevInfo.edge);
        curr = prevInfo.fromNodeId;
      }
      pathNodeIds.unshift(startNodeId);

      let totalDistanceKm = 0;
      let totalTimeMinutes = 0;
      const polylineCoords = [];

      segments.forEach((seg, idx) => {
        totalDistanceKm += seg.distanceKm;
        totalTimeMinutes += seg.travelTimeMinutes;
        if (idx === 0) {
          polylineCoords.push(...seg.coords);
        } else {
          polylineCoords.push(...seg.coords.slice(1));
        }
      });

      return {
        success: true,
        algorithm: 'A*',
        path: pathNodeIds,
        pathNodes: pathNodeIds.map(id => ROAD_NODES[id]),
        segments,
        coords: polylineCoords.length > 0 ? polylineCoords : pathNodeIds.map(id => ROAD_NODES[id].coords),
        totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
        totalTimeMinutes: Math.round(totalTimeMinutes * 10) / 10,
        cost: gScore[targetNodeId]
      };
    }

    openSet.delete(current);

    const neighbors = graph[current] || [];
    for (const edge of neighbors) {
      const neighbor = edge.to;
      const edgeWeight = weightMetric === 'distance' ? edge.distanceKm : edge.travelTimeMinutes;
      const tentativeG = gScore[current] + edgeWeight;

      if (tentativeG < gScore[neighbor]) {
        cameFrom[neighbor] = {
          fromNodeId: current,
          edge
        };
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + heuristic(neighbor);

        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
      }
    }
  }

  return {
    success: false,
    error: 'A* could not find a path between the selected locations due to network disconnection.',
    path: [],
    pathNodes: [],
    coords: []
  };
}
