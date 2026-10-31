import { findShortestPathDijkstra } from './dijkstra';
import { findNearestNode } from '../utils/calculations';

/**
 * Smart Ambulance Assignment Algorithm
 * Evaluates fleet availability, required medical equipment compatibility,
 * and calculates exact road-network travel time using Dijkstra's algorithm.
 *
 * @param {Object} emergency - The emergency request object
 * @param {Array} ambulances - The current fleet of ambulances
 * @param {Object} options - Custom weights and graph options
 * @returns {Object} Comprehensive evaluation result with ranked candidates and best recommendation
 */
export function evaluateAmbulanceAssignment(emergency, ambulances, options = {}) {
  const {
    etaWeight = 0.50,
    equipmentWeight = 0.35,
    reliabilityWeight = 0.15,
    blockedEdgeIds = new Set(),
    trafficMultipliers = {}
  } = options;

  // Find patient's nearest road network node
  const patientNodeId = emergency.nearestNodeId || findNearestNode(emergency.coords).nodeId;
  const requiredEquipment = emergency.requiredAssistance || [];

  const candidates = [];

  for (const amb of ambulances) {
    // 1. Availability check: skip busy, assigned, or out of service
    const isAvailable = amb.status === 'Available';
    if (!isAvailable) {
      candidates.push({
        ambulance: amb,
        isEligible: false,
        disqualificationReason: `Status is "${amb.status}" (unavailable for new dispatch)`,
        score: 0,
        route: null,
        etaMinutes: null,
        equipmentMatchPct: 0
      });
      continue;
    }

    // 2. Equipment matching check
    const ambEquipmentSet = new Set((amb.equipment || []).map(e => e.toLowerCase()));
    const missingEquipment = [];
    let matchedCount = 0;

    requiredEquipment.forEach(req => {
      const normalized = req.toLowerCase();
      // Match key equipment terms (e.g. oxygen, ventilator, defibrillator, stretcher)
      const found = Array.from(ambEquipmentSet).some(item =>
        item.includes(normalized) || normalized.includes(item)
      );
      if (found) {
        matchedCount++;
      } else {
        missingEquipment.push(req);
      }
    });

    const equipmentMatchPct =
      requiredEquipment.length === 0
        ? 100
        : Math.round((matchedCount / requiredEquipment.length) * 100);

    // If critical emergency requires ventilator or defibrillator and ambulance lacks it, penalize or disqualify
    const isCritical = emergency.priority === 'Critical';
    const lacksCriticalGear =
      isCritical &&
      ((requiredEquipment.includes('Ventilator') && missingEquipment.includes('Ventilator')) ||
        (requiredEquipment.includes('Defibrillator') && missingEquipment.includes('Defibrillator')));

    // 3. Calculate road network route using Dijkstra from ambulance's current node to patient
    const ambNodeId = amb.currentNodeId || findNearestNode(amb.coords).nodeId;
    const route = findShortestPathDijkstra(ambNodeId, patientNodeId, {
      blockedEdgeIds,
      trafficMultipliers
    });

    if (!route.success) {
      candidates.push({
        ambulance: amb,
        isEligible: false,
        disqualificationReason: 'No accessible road path to patient location due to road closures.',
        score: 0,
        route: null,
        etaMinutes: null,
        equipmentMatchPct
      });
      continue;
    }

    const eta = route.totalTimeMinutes;
    const distanceKm = route.totalDistanceKm;

    // 4. Multi-Criteria Scoring (0 to 100)
    // Faster ETA -> higher score (scaled: 1 min = 100, 20 mins = 0)
    const etaScore = Math.max(0, Math.min(100, Math.round(100 - (eta / 20) * 100)));
    const equipScore = equipmentMatchPct;
    const reliabilityScore = amb.fuelLevel ? parseInt(amb.fuelLevel, 10) : 90;

    // Composite weighted score
    let compositeScore =
      etaScore * etaWeight +
      equipScore * equipmentWeight +
      reliabilityScore * reliabilityWeight;

    // Disqualification penalty if missing critical life support
    if (lacksCriticalGear) {
      compositeScore *= 0.5; // heavy penalty
    }

    candidates.push({
      ambulance: amb,
      isEligible: true,
      score: Math.round(compositeScore * 10) / 10,
      etaScore,
      equipScore,
      reliabilityScore,
      etaMinutes: eta,
      distanceKm,
      equipmentMatchPct,
      missingEquipment,
      lacksCriticalGear,
      route,
      startNodeId: ambNodeId,
      targetNodeId: patientNodeId,
      recommendationReason: `ETA ${eta} mins (${distanceKm} km) via ${route.segments.map(s => s.roadName).slice(0, 2).join(', ')} with ${equipmentMatchPct}% equipment compatibility.`
    });
  }

  // Filter eligible and sort descending by composite score, tie-break on lower ETA
  const eligible = candidates
    .filter(c => c.isEligible)
    .sort((a, b) => b.score - a.score || a.etaMinutes - b.etaMinutes);

  const selectedAmbulance = eligible.length > 0 ? eligible[0] : null;

  return {
    emergencyId: emergency.id,
    patientNodeId,
    totalFleetEvaluated: ambulances.length,
    eligibleCount: eligible.length,
    selectedAmbulance,
    rankedCandidates: eligible,
    allCandidates: candidates,
    generatedAt: new Date().toISOString()
  };
}
