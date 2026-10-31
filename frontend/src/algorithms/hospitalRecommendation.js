import { findShortestPathDijkstra } from './dijkstra';
import { findNearestNode } from '../utils/calculations';

/**
 * Intelligent Hospital Recommendation Algorithm
 * Stage 1: Hard eligibility filtering based on specialized medical department and bed availability.
 * Stage 2: Weighted composite scoring:
 *          Hospital Score = 40% Facility Match + 30% Capacity Availability + 30% Travel-Time Score
 *
 * @param {Object} emergency - Emergency request object
 * @param {Array} hospitals - List of available hospitals
 * @param {Object} options - Custom parameters and graph conditions
 * @returns {Object} Comprehensive evaluation with ranked hospitals and explanations
 */
export function evaluateHospitalRecommendation(emergency, hospitals, options = {}) {
  const {
    facilityWeight = 0.40,
    capacityWeight = 0.30,
    travelTimeWeight = 0.30,
    blockedEdgeIds = new Set(),
    trafficMultipliers = {}
  } = options;

  const patientNodeId = emergency.nearestNodeId || findNearestNode(emergency.coords).nodeId;
  const emergencyType = emergency.emergencyType || 'General';
  const isCritical = emergency.priority === 'Critical';

  // Determine required medical specialties based on emergency type
  const requiredSpecialties = [];
  if (emergencyType === 'Cardiac Emergency') {
    requiredSpecialties.push('Cardiac', 'ICU', 'Emergency');
  } else if (emergencyType === 'Road Accident' || emergencyType === 'Critical Injury') {
    requiredSpecialties.push('Trauma', 'Emergency');
    if (isCritical) requiredSpecialties.push('ICU');
  } else if (emergencyType === 'Breathing Problem') {
    requiredSpecialties.push('ICU', 'Emergency');
  } else {
    requiredSpecialties.push('Emergency');
  }

  const evaluated = [];

  for (const hosp of hospitals) {
    const reasons = [];
    let isEligible = true;

    // Hard Constraint 1: Must have active Emergency Department
    if (!hosp.hasEmergencyDept) {
      isEligible = false;
      reasons.push('Does not operate an active 24/7 Emergency Department');
    }

    // Hard Constraint 2: Must have available Emergency Beds
    if (hosp.availableEmergencyBeds <= 0) {
      isEligible = false;
      reasons.push('Zero available Emergency department beds');
    }

    // Hard Constraint 3: If emergency requires ICU (e.g. Critical Cardiac/Trauma), must have ICU beds
    const requiresICU = isCritical || requiredSpecialties.includes('ICU');
    if (requiresICU && (!hosp.hasICU || hosp.availableIcuBeds <= 0)) {
      isEligible = false;
      reasons.push('No available ICU beds for critical life support triage');
    }

    // Hard Constraint 4: Must offer at least the core primary service
    const hospServices = hosp.services || [];
    const missingSpecialties = requiredSpecialties.filter(req => !hospServices.includes(req));

    if (missingSpecialties.length > 0) {
      // If critical missing core specialty (like Cardiac for Cardiac Emergency or Trauma for road accident)
      const lacksCore = (emergencyType === 'Cardiac Emergency' && missingSpecialties.includes('Cardiac')) ||
                        (emergencyType === 'Road Accident' && missingSpecialties.includes('Trauma'));
      if (lacksCore) {
        isEligible = false;
        reasons.push(`Lacks dedicated ${missingSpecialties.join(', ')} department`);
      }
    }

    // Calculate road network travel distance and ETA using Dijkstra
    const hospitalNodeId = hosp.nodeId || findNearestNode(hosp.coords).nodeId;
    const route = findShortestPathDijkstra(patientNodeId, hospitalNodeId, {
      blockedEdgeIds,
      trafficMultipliers
    });

    if (!route.success) {
      isEligible = false;
      reasons.push('Road network unreachable due to road blockages');
    }

    if (!isEligible) {
      evaluated.push({
        hospital: hosp,
        isEligible: false,
        disqualificationReason: reasons.join('; '),
        score: 0,
        facilityScore: 0,
        capacityScore: 0,
        travelTimeScore: 0,
        etaMinutes: route.success ? route.totalTimeMinutes : null,
        distanceKm: route.success ? route.totalDistanceKm : null,
        route: route.success ? route : null
      });
      continue;
    }

    // 2. Compute Normalized Component Scores (0 to 100)

    // Facility Match Score (0 - 100)
    const matchedServices = requiredSpecialties.filter(s => hospServices.includes(s));
    const facilityMatchPct = Math.round((matchedServices.length / requiredSpecialties.length) * 100);
    const facilityScore = facilityMatchPct;

    // Capacity Score (0 - 100)
    // Higher ratio of available beds = higher score
    const emgRatio = hosp.totalEmergencyBeds > 0 ? (hosp.availableEmergencyBeds / hosp.totalEmergencyBeds) : 0;
    const icuRatio = hosp.totalIcuBeds > 0 ? (hosp.availableIcuBeds / hosp.totalIcuBeds) : 0.5;
    const capacityScore = Math.min(100, Math.round((emgRatio * 50 + icuRatio * 50)));

    // Travel-Time Score (0 - 100)
    // Scaled: 1 min travel time = 100, 25 mins travel time = 0
    const eta = route.totalTimeMinutes;
    const travelTimeScore = Math.max(0, Math.min(100, Math.round(100 - (eta / 25) * 100)));

    // Composite Weighted Score
    const totalScore = Math.round(
      (facilityScore * facilityWeight +
       capacityScore * capacityWeight +
       travelTimeScore * travelTimeWeight) * 10
    ) / 10;

    evaluated.push({
      hospital: hosp,
      isEligible: true,
      score: totalScore,
      facilityScore,
      capacityScore,
      travelTimeScore,
      etaMinutes: eta,
      distanceKm: route.totalDistanceKm,
      route,
      matchedServices,
      missingSpecialties,
      recommendationReason: `ETA ${eta} mins (${route.totalDistanceKm} km), ${hosp.availableEmergencyBeds} emergency beds, ${hosp.availableIcuBeds} ICU beds available, 100% service match for ${emergencyType}.`
    });
  }

  // Filter eligible and sort descending by score
  const eligible = evaluated
    .filter(h => h.isEligible)
    .sort((a, b) => b.score - a.score || a.etaMinutes - b.etaMinutes);

  const bestHospital = eligible.length > 0 ? eligible[0] : null;
  const topRecommendations = eligible.slice(0, 3);

  return {
    emergencyId: emergency.id,
    patientNodeId,
    requiredSpecialties,
    bestHospital,
    topRecommendations,
    allEvaluations: evaluated,
    generatedAt: new Date().toISOString()
  };
}
