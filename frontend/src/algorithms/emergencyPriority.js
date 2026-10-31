/**
 * Emergency Priority Assessment Algorithm
 * Transparent, rule-based algorithmic priority classification.
 *
 * NOTE FOR HACKATHON EVALUATION:
 * This system provides automated resource prioritization for emergency dispatch
 * and does not constitute a clinical medical diagnosis.
 */

export const PRIORITY_LEVELS = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  NORMAL: 'Normal'
};

/**
 * Evaluates reported emergency attributes and returns transparent priority ranking with rule explanations.
 *
 * @param {Object} emergencyData
 * @returns {Object} { priority, score, matchedRules, explanation }
 */
export function classifyEmergencyPriority(emergencyData) {
  const {
    emergencyType = '',
    description = '',
    requiredAssistance = [],
    patientAge = 30
  } = emergencyData;

  const descLower = (description || '').toLowerCase();
  const matchedRules = [];
  let score = 0; // 0 to 100

  // 1. Life-Threatening Critical Triggers (Score +50 to +70)
  const criticalKeywords = [
    'cardiac arrest', 'heart attack', 'unconscious', 'not breathing',
    'heavy bleeding', 'severe trauma', 'head injury', 'stroke',
    'choking', 'crush injury', 'coma', 'chest pain radiating'
  ];

  const foundCriticalKeyword = criticalKeywords.find(kw => descLower.includes(kw));
  if (foundCriticalKeyword) {
    score += 60;
    matchedRules.push({
      rule: 'Life-Threatening Symptom Keyword',
      description: `Reported key symptom indicator: "${foundCriticalKeyword}"`,
      weight: '+60 pts'
    });
  }

  // 2. High-Risk Emergency Categories
  if (emergencyType === 'Cardiac Emergency') {
    score += 55;
    matchedRules.push({
      rule: 'Cardiac Category Risk',
      description: 'Acute coronary/cardiac symptom profile requires golden-hour intervention',
      weight: '+55 pts'
    });
  } else if (emergencyType === 'Road Accident') {
    score += 45;
    matchedRules.push({
      rule: 'Road Accident Vehicular Trauma',
      description: 'High kinetic energy impact risk with potential concealed internal hemorrhaging',
      weight: '+45 pts'
    });
  } else if (emergencyType === 'Critical Injury') {
    score += 50;
    matchedRules.push({
      rule: 'Critical Trauma Category',
      description: 'Severe physical trauma or penetrating wound',
      weight: '+50 pts'
    });
  } else if (emergencyType === 'Breathing Problem') {
    score += 40;
    matchedRules.push({
      rule: 'Acute Respiratory Distress',
      description: 'Airway compromise or rapid desaturation hazard',
      weight: '+40 pts'
    });
  } else if (emergencyType === 'Minor Injury') {
    score += 15;
    matchedRules.push({
      rule: 'Minor Trauma Baseline',
      description: 'Superficial lacerations, mild contusions, or stable extremities',
      weight: '+15 pts'
    });
  } else {
    score += 20;
    matchedRules.push({
      rule: 'General Category Baseline',
      description: 'Uncategorized emergency presentation',
      weight: '+20 pts'
    });
  }

  // 3. Equipment Need Accelerators
  const reqLower = requiredAssistance.map(a => a.toLowerCase());
  if (reqLower.includes('defibrillator')) {
    score += 25;
    matchedRules.push({
      rule: 'Defibrillator Requested',
      description: 'Cardiac rhythm shock capability required immediately',
      weight: '+25 pts'
    });
  }
  if (reqLower.includes('ventilator')) {
    score += 25;
    matchedRules.push({
      rule: 'Ventilator Requested',
      description: 'Mechanical respiratory support apparatus needed',
      weight: '+25 pts'
    });
  }
  if (reqLower.includes('oxygen')) {
    score += 15;
    matchedRules.push({
      rule: 'Oxygen Support Requested',
      description: 'Supplemental oxygen therapy necessary',
      weight: '+15 pts'
    });
  }
  if (reqLower.includes('trauma kit')) {
    score += 15;
    matchedRules.push({
      rule: 'Trauma Kit Requested',
      description: 'Hemostatic dressing and immobilization equipment needed',
      weight: '+15 pts'
    });
  }

  // 4. Age Demographic Vulnerability Modifier
  const age = Number(patientAge) || 30;
  if (age < 5 || age > 65) {
    score += 10;
    matchedRules.push({
      rule: 'High Vulnerability Age Demographic',
      description: `Patient age ${age} (pediatric / geriatric rapid decompensation factor)`,
      weight: '+10 pts'
    });
  }

  // Final Priority Categorization
  let priority = PRIORITY_LEVELS.NORMAL;
  let explanation = '';

  if (score >= 70) {
    priority = PRIORITY_LEVELS.CRITICAL;
    explanation = 'Score >= 70: Immediate life threat identified. Maximum dispatch urgency with ALS/MICU equipped vehicle.';
  } else if (score >= 50) {
    priority = PRIORITY_LEVELS.HIGH;
    explanation = 'Score 50-69: Urgent emergency with high risk of rapid patient deterioration. Requires rapid response.';
  } else if (score >= 30) {
    priority = PRIORITY_LEVELS.MEDIUM;
    explanation = 'Score 30-49: Serious medical condition requiring prompt clinical transport without acute life threat.';
  } else {
    priority = PRIORITY_LEVELS.NORMAL;
    explanation = 'Score < 30: Stable non-emergent condition. Standard BLS ambulance allocation appropriate.';
  }

  return {
    priority,
    score: Math.min(100, score),
    matchedRules,
    explanation,
    evaluatedAt: new Date().toISOString()
  };
}
