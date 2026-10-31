/**
 * Solapur Ambulance Stations Sample Data
 * >= 4 stations with realistic locations and capacities
 */

export const INITIAL_STATIONS = [
  {
    id: 'STAT-01',
    name: 'Civil Hospital Emergency Hub',
    location: 'Sadar Bazar / Medical College Campus',
    coords: [17.6715, 75.9102],
    nodeId: 'N_CIVIL',
    totalAmbulances: 4,
    availableAmbulances: 3,
    busyAmbulances: 1,
    phone: '+91 217 2745601',
    headParamedic: 'Dr. Ramesh Kulkarni'
  },
  {
    id: 'STAT-02',
    name: 'Saat Rasta Central Response Depot',
    location: 'Saat Rasta Junction, Central Solapur',
    coords: [17.6650, 75.9080],
    nodeId: 'N_SAAT_RASTA',
    totalAmbulances: 3,
    availableAmbulances: 2,
    busyAmbulances: 1,
    phone: '+91 217 2623344',
    headParamedic: 'Officer Sunita Shinde'
  },
  {
    id: 'STAT-03',
    name: 'MIDC Industrial Rescue Station',
    location: 'Akkalkot Road Industrial Area',
    coords: [17.6430, 75.9320],
    nodeId: 'N_MIDC',
    totalAmbulances: 2,
    availableAmbulances: 1,
    busyAmbulances: 1,
    phone: '+91 217 2651122',
    headParamedic: 'Paramedic Anand Patil'
  },
  {
    id: 'STAT-04',
    name: 'Ashok Chowk Eastern Unit',
    location: 'Ashok Chowk, Near Old Employment Office',
    coords: [17.6580, 75.9210],
    nodeId: 'N_ASHOK_CHOWK',
    totalAmbulances: 2,
    availableAmbulances: 2,
    busyAmbulances: 0,
    phone: '+91 217 2319088',
    headParamedic: 'Paramedic Vikas Gaikwad'
  },
  {
    id: 'STAT-05',
    name: 'Jule Solapur Southern Outpost',
    location: 'Vijapur Road, Near D-Mart',
    coords: [17.6380, 75.9010],
    nodeId: 'N_VIJAPUR_RD',
    totalAmbulances: 2,
    availableAmbulances: 1,
    busyAmbulances: 1,
    phone: '+91 217 2348899',
    headParamedic: 'Paramedic Priya Deshmukh'
  }
];
