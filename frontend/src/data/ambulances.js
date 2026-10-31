/**
 * Solapur Ambulance Fleet Sample Data
 * >= 8 ambulances with varied medical equipment, current node locations, and statuses
 */

export const INITIAL_AMBULANCES = [
  {
    id: 'AMB-101',
    vehicleNumber: 'MH-13-AZ-1102',
    type: 'Advanced Life Support (ALS)',
    stationId: 'STAT-01',
    stationName: 'Civil Hospital Emergency Hub',
    currentNodeId: 'N_CIVIL',
    locationName: 'Civil Hospital Depot',
    coords: [17.6715, 75.9102],
    status: 'Available', // Available, Assigned, On the way, Busy, Out of service
    equipment: [
      'Oxygen cylinder',
      'Ventilator',
      'Defibrillator',
      'Stretcher',
      'First aid kit',
      'Emergency medical kit'
    ],
    driverName: 'Sanjay More',
    driverPhone: '+91 98220 11234',
    driverExperience: '8 years',
    fuelLevel: '92%',
    speedKmh: 45
  },
  {
    id: 'AMB-102',
    vehicleNumber: 'MH-13-BX-4509',
    type: 'Basic Life Support (BLS)',
    stationId: 'STAT-01',
    stationName: 'Civil Hospital Emergency Hub',
    currentNodeId: 'N_STATION_RD',
    locationName: 'Solapur Railway Station Junction',
    coords: [17.6690, 75.9020],
    status: 'Available',
    equipment: [
      'Oxygen cylinder',
      'Stretcher',
      'First aid kit',
      'Emergency medical kit'
    ],
    driverName: 'Rahul Jadhav',
    driverPhone: '+91 98221 44556',
    driverExperience: '5 years',
    fuelLevel: '85%',
    speedKmh: 42
  },
  {
    id: 'AMB-103',
    vehicleNumber: 'MH-13-CZ-7890',
    type: 'Cardiac Care Unit (CCU)',
    stationId: 'STAT-02',
    stationName: 'Saat Rasta Central Response Depot',
    currentNodeId: 'N_SAAT_RASTA',
    locationName: 'Saat Rasta Square',
    coords: [17.6650, 75.9080],
    status: 'Available',
    equipment: [
      'Oxygen cylinder',
      'Defibrillator',
      'Ventilator',
      'Stretcher',
      'First aid kit',
      'Emergency medical kit'
    ],
    driverName: 'Mahesh Bansode',
    driverPhone: '+91 94220 33412',
    driverExperience: '11 years',
    fuelLevel: '95%',
    speedKmh: 48
  },
  {
    id: 'AMB-104',
    vehicleNumber: 'MH-13-DF-2341',
    type: 'Basic Life Support (BLS)',
    stationId: 'STAT-02',
    stationName: 'Saat Rasta Central Response Depot',
    currentNodeId: 'N_RANG_BHAVAN',
    locationName: 'Rang Bhavan Chowk',
    coords: [17.6610, 75.9050],
    status: 'Available',
    equipment: [
      'Oxygen cylinder',
      'Stretcher',
      'First aid kit',
      'Emergency medical kit'
    ],
    driverName: 'Amit Waghmare',
    driverPhone: '+91 97630 88910',
    driverExperience: '4 years',
    fuelLevel: '78%',
    speedKmh: 40
  },
  {
    id: 'AMB-105',
    vehicleNumber: 'MH-13-ER-6721',
    type: 'Trauma & Emergency Care',
    stationId: 'STAT-03',
    stationName: 'MIDC Industrial Rescue Station',
    currentNodeId: 'N_MIDC',
    locationName: 'MIDC Industrial Area',
    coords: [17.6430, 75.9320],
    status: 'Available',
    equipment: [
      'Oxygen cylinder',
      'Ventilator',
      'Defibrillator',
      'Stretcher',
      'First aid kit',
      'Emergency medical kit'
    ],
    driverName: 'Ganesh Mane',
    driverPhone: '+91 99230 45612',
    driverExperience: '9 years',
    fuelLevel: '88%',
    speedKmh: 46
  },
  {
    id: 'AMB-106',
    vehicleNumber: 'MH-13-FT-9912',
    type: 'Basic Life Support (BLS)',
    stationId: 'STAT-04',
    stationName: 'Ashok Chowk Eastern Unit',
    currentNodeId: 'N_ASHOK_CHOWK',
    locationName: 'Ashok Chowk',
    coords: [17.6580, 75.9210],
    status: 'Available',
    equipment: [
      'Oxygen cylinder',
      'Stretcher',
      'First aid kit',
      'Emergency medical kit'
    ],
    driverName: 'Deepak Kale',
    driverPhone: '+91 94231 67890',
    driverExperience: '6 years',
    fuelLevel: '80%',
    speedKmh: 43
  },
  {
    id: 'AMB-107',
    vehicleNumber: 'MH-13-GA-3429',
    type: 'Advanced Life Support (ALS)',
    stationId: 'STAT-04',
    stationName: 'Ashok Chowk Eastern Unit',
    currentNodeId: 'N_PARK_STADIUM',
    locationName: 'Park Stadium Chowk',
    coords: [17.6680, 75.9160],
    status: 'Available',
    equipment: [
      'Oxygen cylinder',
      'Defibrillator',
      'Ventilator',
      'Stretcher',
      'First aid kit',
      'Emergency medical kit'
    ],
    driverName: 'Kiran Salunke',
    driverPhone: '+91 98229 55677',
    driverExperience: '7 years',
    fuelLevel: '91%',
    speedKmh: 45
  },
  {
    id: 'AMB-108',
    vehicleNumber: 'MH-13-HB-8120',
    type: 'Mobile Intensive Care Unit (MICU)',
    stationId: 'STAT-05',
    stationName: 'Jule Solapur Southern Outpost',
    currentNodeId: 'N_VIJAPUR_RD',
    locationName: 'Vijapur Road / Jule Solapur',
    coords: [17.6380, 75.9010],
    status: 'Available',
    equipment: [
      'Oxygen cylinder',
      'Ventilator',
      'Defibrillator',
      'Stretcher',
      'First aid kit',
      'Emergency medical kit'
    ],
    driverName: 'Prashant Kamble',
    driverPhone: '+91 98901 23456',
    driverExperience: '12 years',
    fuelLevel: '84%',
    speedKmh: 47
  },
  {
    id: 'AMB-109',
    vehicleNumber: 'MH-13-JX-1990',
    type: 'Advanced Life Support (ALS)',
    stationId: 'STAT-01',
    stationName: 'Civil Hospital Emergency Hub',
    currentNodeId: 'N_CIVIL',
    locationName: 'Civil Hospital Depot',
    coords: [17.6715, 75.9102],
    status: 'Busy', // Demonstrating busy fleet filtering
    equipment: [
      'Oxygen cylinder',
      'Ventilator',
      'Defibrillator',
      'Stretcher',
      'First aid kit'
    ],
    driverName: 'Vijay Chavan',
    driverPhone: '+91 94225 77889',
    driverExperience: '10 years',
    fuelLevel: '65%',
    speedKmh: 44
  },
  {
    id: 'AMB-110',
    vehicleNumber: 'MH-13-KL-5544',
    type: 'Basic Life Support (BLS)',
    stationId: 'STAT-05',
    stationName: 'Jule Solapur Southern Outpost',
    currentNodeId: 'N_HOTGI_RD',
    locationName: 'Hotgi Road Junction',
    coords: [17.6450, 75.9180],
    status: 'Out of service', // Demonstrating out-of-service maintenance filtering
    equipment: ['Oxygen cylinder', 'Stretcher', 'First aid kit'],
    driverName: 'Nitin Pawar',
    driverPhone: '+91 97645 11223',
    driverExperience: '3 years',
    fuelLevel: '30%',
    speedKmh: 40
  }
];
