/**
 * Solapur Sample Hospitals Data
 * >= 6 hospitals with realistic coordinates, bed capacity, and specialized medical services
 * Note: Data is fictional and created for prototype demonstration.
 */

export const INITIAL_HOSPITALS = [
  {
    id: 'HOSP-01',
    name: 'Chhatrapati Shivaji Maharaj Govt. Civil Hospital',
    address: 'Sadar Bazar, Near Old Employment Exchange, Solapur - 413003',
    coords: [17.6715, 75.9102],
    nodeId: 'N_CIVIL',
    phone: '+91 217 2745555',
    hasEmergencyDept: true,
    hasICU: true,
    totalIcuBeds: 28,
    availableIcuBeds: 6,
    totalEmergencyBeds: 45,
    availableEmergencyBeds: 12,
    services: [
      'Emergency',
      'ICU',
      'Trauma',
      'Cardiac',
      'Orthopedic',
      'General Medicine',
      'Neurology'
    ],
    rating: 4.6,
    traumaLevel: 'Level 1 Trauma Center',
    isGovt: true
  },
  {
    id: 'HOSP-02',
    name: 'Ashwini Sahakari Rugnalaya & Research Centre',
    address: 'North Sadar Bazar, Solapur - 413003',
    coords: [17.6675, 75.9110],
    nodeId: 'N_CIVIL',
    phone: '+91 217 2319900',
    hasEmergencyDept: true,
    hasICU: true,
    totalIcuBeds: 24,
    availableIcuBeds: 5,
    totalEmergencyBeds: 35,
    availableEmergencyBeds: 9,
    services: [
      'Emergency',
      'ICU',
      'Cardiac',
      'Trauma',
      'Neurology',
      'General Medicine'
    ],
    rating: 4.8,
    traumaLevel: 'Advanced Cardiac & Trauma',
    isGovt: false
  },
  {
    id: 'HOSP-03',
    name: 'Markandey Sahakari Rugnalaya',
    address: 'Ashok Chowk Road, Sakhar Peth, Solapur - 413005',
    coords: [17.6580, 75.9210],
    nodeId: 'N_ASHOK_CHOWK',
    phone: '+91 217 2622345',
    hasEmergencyDept: true,
    hasICU: true,
    totalIcuBeds: 18,
    availableIcuBeds: 4,
    totalEmergencyBeds: 30,
    availableEmergencyBeds: 8,
    services: [
      'Emergency',
      'ICU',
      'Cardiac',
      'Orthopedic',
      'General Medicine'
    ],
    rating: 4.5,
    traumaLevel: 'Multi-Specialty Care',
    isGovt: false
  },
  {
    id: 'HOSP-04',
    name: 'Sparsh Hospital & Trauma Centre',
    address: 'Old Pune Naka, Pune Highway, Solapur - 413001',
    coords: [17.6790, 75.8990],
    nodeId: 'N_OLD_PUNE_NAKA',
    phone: '+91 217 2728900',
    hasEmergencyDept: true,
    hasICU: true,
    totalIcuBeds: 16,
    availableIcuBeds: 3,
    totalEmergencyBeds: 25,
    availableEmergencyBeds: 7,
    services: [
      'Emergency',
      'ICU',
      'Trauma',
      'Orthopedic',
      'General Medicine'
    ],
    rating: 4.7,
    traumaLevel: 'Level 2 Trauma Specialist',
    isGovt: false
  },
  {
    id: 'HOSP-05',
    name: 'Dr. V.M. Govt. Medical College Hospital',
    address: 'Opposite Rang Bhavan, Railway Lines, Solapur - 413002',
    coords: [17.6610, 75.9050],
    nodeId: 'N_RANG_BHAVAN',
    phone: '+91 217 2314567',
    hasEmergencyDept: true,
    hasICU: true,
    totalIcuBeds: 20,
    availableIcuBeds: 4,
    totalEmergencyBeds: 40,
    availableEmergencyBeds: 11,
    services: [
      'Emergency',
      'ICU',
      'Trauma',
      'Neurology',
      'General Medicine',
      'Orthopedic'
    ],
    rating: 4.4,
    traumaLevel: 'Tertiary Medical Center',
    isGovt: true
  },
  {
    id: 'HOSP-06',
    name: 'Gangamai Super-Specialty Hospital',
    address: 'Vijapur Road, Near Old RTO, Jule Solapur - 413004',
    coords: [17.6380, 75.9010],
    nodeId: 'N_VIJAPUR_RD',
    phone: '+91 217 2341200',
    hasEmergencyDept: true,
    hasICU: true,
    totalIcuBeds: 15,
    availableIcuBeds: 3,
    totalEmergencyBeds: 22,
    availableEmergencyBeds: 6,
    services: [
      'Emergency',
      'ICU',
      'Cardiac',
      'Neurology',
      'General Medicine'
    ],
    rating: 4.6,
    traumaLevel: 'Cardiac & Neuro Hub',
    isGovt: false
  },
  {
    id: 'HOSP-07',
    name: 'MIDC Emergency Medical Facility',
    address: 'Plot 42, Akkalkot Road Industrial Sector, Solapur - 413006',
    coords: [17.6430, 75.9320],
    nodeId: 'N_MIDC',
    phone: '+91 217 2658911',
    hasEmergencyDept: true,
    hasICU: false, // Intentionally no ICU to test eligibility filtering!
    totalIcuBeds: 0,
    availableIcuBeds: 0,
    totalEmergencyBeds: 15,
    availableEmergencyBeds: 4,
    services: [
      'Emergency',
      'Trauma',
      'Orthopedic',
      'General Medicine'
    ],
    rating: 4.1,
    traumaLevel: 'Industrial First Response',
    isGovt: false
  }
];
