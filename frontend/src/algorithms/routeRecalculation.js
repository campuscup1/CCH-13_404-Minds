import { findShortestPathDijkstra } from './dijkstra';
import { findShortestPathAStar } from './astar';
import { ROAD_EDGES, ROAD_NODES } from '../data/roadNetwork';

/**
 * Dynamic Route Recalculation Engine
 * Demonstrates real-time graph recalculation when an edge is blocked or experiencing heavy traffic.
 *
 * @param {string} startNodeId - Route start node
 * @param {string} targetNodeId - Route target node
 * @param {Object} currentContext - Active route context including blocked edges & traffic multipliers
 * @param {string} algorithmName - 'Dijkstra' or 'A*'
 * @returns {Object} Comprehensive old vs new route comparison
 */
export function recalculateDynamicRoute(startNodeId, targetNodeId, currentContext = {}, algorithmName = 'Dijkstra') {
  const {
    blockedEdgeIds = new Set(),
    trafficMultipliers = {},
    simulatedBlockedEdgeId = null,
    weightMetric = 'travelTime'
  } = currentContext;

  const pathFinder = algorithmName === 'A*' ? findShortestPathAStar : findShortestPathDijkstra;

  // 1. Calculate the initial baseline route WITHOUT the new blockage
  const originalBlocked = new Set(blockedEdgeIds);
  if (simulatedBlockedEdgeId) {
    originalBlocked.delete(simulatedBlockedEdgeId);
  }

  const originalRoute = pathFinder(startNodeId, targetNodeId, {
    weightMetric,
    blockedEdgeIds: originalBlocked,
    trafficMultipliers: {}
  });

  // 2. Prepare new blockage state
  const updatedBlocked = new Set(blockedEdgeIds);
  if (simulatedBlockedEdgeId) {
    updatedBlocked.add(simulatedBlockedEdgeId);
  }

  // 3. Re-run algorithm on updated graph
  const newRoute = pathFinder(startNodeId, targetNodeId, {
    weightMetric,
    blockedEdgeIds: updatedBlocked,
    trafficMultipliers
  });

  // Find info about the blocked edge
  const blockedEdge = ROAD_EDGES.find(e => e.id === simulatedBlockedEdgeId);
  const blockedEdgeName = blockedEdge ? `${blockedEdge.roadName} (${ROAD_NODES[blockedEdge.from]?.name} <-> ${ROAD_NODES[blockedEdge.to]?.name})` : 'Selected Corridor';

  if (!newRoute.success) {
    return {
      success: false,
      hasAlternative: false,
      originalRoute,
      newRoute: null,
      blockedEdge,
      blockedEdgeName,
      alert: {
        type: 'critical',
        message: `CRITICAL ALERT: Road closure on ${blockedEdgeName} isolates the destination. No alternative road route found in the network!`
      }
    };
  }

  // Calculate delta metrics
  const oldDist = originalRoute.totalDistanceKm || 0;
  const newDist = newRoute.totalDistanceKm || 0;
  const distDiff = Math.round((newDist - oldDist) * 10) / 10;

  const oldTime = originalRoute.totalTimeMinutes || 0;
  const newTime = newRoute.totalTimeMinutes || 0;
  const timeDiff = Math.round((newTime - oldTime) * 10) / 10;

  const isDetourRequired = Boolean(simulatedBlockedEdgeId && updatedBlocked.has(simulatedBlockedEdgeId));

  return {
    success: true,
    hasAlternative: true,
    algorithmUsed: algorithmName,
    originalRoute,
    newRoute,
    blockedEdge,
    blockedEdgeName,
    metricsComparison: {
      originalDistanceKm: oldDist,
      newDistanceKm: newDist,
      distanceDiffKm: distDiff,
      originalTimeMinutes: oldTime,
      newTimeMinutes: newTime,
      timeDiffMinutes: timeDiff,
      isDetourRequired
    },
    alert: {
      type: 'warning',
      title: 'Road Blockage Detected & Route Rerouted',
      message: `Road blockage detected on ${blockedEdgeName}. Real-time ${algorithmName} algorithm recalculated an optimal alternative route: ${newDist} km (${newTime} mins, +${timeDiff} mins delay).`
    }
  };
}
