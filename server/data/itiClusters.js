export const ITI_CLUSTERS = [
  {
    district: 'Pune',
    state: 'Maharashtra',
    industrialCorridors: [
      {
        name: 'Chakan - Bhosari - Talegaon Auto & EV Corridor',
        distanceKm: 28,
        majorCompanies: ['Tata Motors EV', 'Bajaj Auto', 'Mahindra & Mahindra', 'Ather Energy', 'Bharat Forge'],
        napsStipendBenchmark: 12000,
        averageBusTransport: 'Company subsidized daily pick & drop from Pune City/Pimpri'
      },
      {
        name: 'Pimpri-Chinchwad Precision Engineering Cluster',
        distanceKm: 16,
        majorCompanies: ['SKF India', 'Sandvik Coromant', 'Thyssenkrupp', 'Forbes Marshall'],
        napsStipendBenchmark: 12500,
        averageBusTransport: 'Local PMPML bus & Pune Metro connectivity'
      }
    ],
    accreditedInstitutes: [
      {
        id: 'iti-aundh-pune',
        name: 'Government Industrial Training Institute (ITI) Aundh, Pune',
        code: 'ITI-MH-PUN-001',
        rating: 4.8,
        schemesAvailable: ['NAPS Direct Apprenticeship', 'STRIVE Dual VET Center of Excellence', 'Free Hostel for Rural Boys & Girls'],
        tradesOffered: ['Mechanic Motor Vehicle (EV Center)', 'Electrician', 'Machinist (CNC Lab)', 'Mechatronics'],
        feesPerYear: '₹1,450 (100% reimbursed for reserved & EWS categories via DBT)',
        address: 'Parihar Chowk, Aundh, Pune, Maharashtra 411007',
        phone: '+91 20 2588 0214'
      },
      {
        id: 'pmkk-chakan',
        name: 'Pradhan Mantri Kaushal Kendra (PMKK) Chakan Industrial Belt',
        code: 'PMKK-MH-PUN-019',
        rating: 4.6,
        schemesAvailable: ['PMKVY 4.0 Free Skilling', 'On-the-Job Training Stipend', 'Corporate Placement Cell'],
        tradesOffered: ['Automotive Assembly Technician', 'Solar PV Installation Specialist', 'CNC Operator'],
        feesPerYear: '₹0 (100% Free Government Funded Training)',
        address: 'MIDC Phase II, Chakan, Pune, Maharashtra 410501',
        phone: '+91 2135 258900'
      },
      {
        id: 'iti-haveli',
        name: 'Government ITI Haveli / Hadapsar, Pune',
        code: 'ITI-MH-PUN-004',
        rating: 4.5,
        schemesAvailable: ['NAPS', 'NCVT Dual Training with Bharat Forge'],
        tradesOffered: ['Fitter', 'Turner', 'Electronics Mechanic'],
        feesPerYear: '₹1,450',
        address: 'Hadapsar Industrial Area, Pune 411028',
        phone: '+91 20 2687 1133'
      }
    ]
  },
  {
    district: 'Nashik',
    state: 'Maharashtra',
    industrialCorridors: [
      {
        name: 'Satpur & Ambad MIDC Industrial Belt',
        distanceKm: 18,
        majorCompanies: ['Bosch Nashik', 'Mahindra', 'Schneider Electric', 'GlaxoSmithKline'],
        napsStipendBenchmark: 11000
      }
    ],
    accreditedInstitutes: [
      {
        id: 'iti-nashik-main',
        name: 'Government ITI Nashik (Satpur MIDC)',
        code: 'ITI-MH-NSK-001',
        rating: 4.7,
        schemesAvailable: ['NAPS', 'STRIVE Scheme'],
        tradesOffered: ['Electrician', 'Solar PV', 'CNC Machinist'],
        feesPerYear: '₹1,450',
        address: 'Trimbak Road, Satpur, Nashik 422007',
        phone: '+91 253 235 0288'
      }
    ]
  }
];
