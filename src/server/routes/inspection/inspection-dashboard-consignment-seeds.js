import { createRequire } from 'node:module'
import {
  ADDITIONAL_DOVER_BASE_WEIGHT_KG,
  ADDITIONAL_DOVER_REFERENCE_START,
  ADDITIONAL_DOVER_WEIGHT_INCREMENT_KG,
  ADDITIONAL_FELIXSTOWE_BASE_WEIGHT_KG,
  ADDITIONAL_FELIXSTOWE_REFERENCE_START,
  ADDITIONAL_FELIXSTOWE_WEIGHT_INCREMENT_KG,
  DOCUMENT_COUNT_CYCLE
} from './inspection-dashboard-consignment-seed-generator-controls.js'
import felixstoweConsignmentSeeds, {
  ATLANTIC_SEAFOODS,
  ATLANTIC_TUNA_IMPORTS,
  HARBOUR_CATCH_IMPORTS,
  NEW_ENGLAND_SEAFOOD_INTERNATIONAL_LTD,
  OCEAN_HARVEST_IMPORTS
} from './inspection-dashboard-consignment-seeds-felixstowe.js'

const require = createRequire(import.meta.url)
const pairedArrivalSeeds = require('./inspection-dashboard-paired-arrival-seeds.json')

const additionalSpecies = [
  'Alaska pollock',
  'European anchovy',
  'Atlantic cod',
  'European pilchard',
  'Yellowfin tuna',
  'Atlantic salmon',
  'European plaice',
  'Common octopus',
  'Northern prawn',
  'Atlantic mackerel',
  'Blue swimming crab',
  'Hoki',
  'European hake',
  'Atlantic horse mackerel',
  'Pacific saury',
  'European sprat',
  'Patagonian toothfish',
  'Greenland halibut',
  'Chilean jack mackerel',
  'Bigeye tuna',
  'Norwegian lobster'
]
const additionalImporters = [
  'North Atlantic Seafood Ltd',
  HARBOUR_CATCH_IMPORTS,
  ATLANTIC_TUNA_IMPORTS,
  OCEAN_HARVEST_IMPORTS,
  'Frinsa UK',
  NEW_ENGLAND_SEAFOOD_INTERNATIONAL_LTD,
  ATLANTIC_SEAFOODS
]
const additionalOrigins = [
  'Iceland',
  'Spain',
  'Ecuador',
  'Norway',
  'Portugal',
  'Ghana',
  'Canada',
  'Peru',
  'India',
  'Morocco'
]
const additionalCommodityCodes = [
  '03036700',
  '03035400',
  '03034320',
  '03048720',
  '03061792',
  '03044990',
  '03048100'
]
const additionalArrivalTimes = [
  '7:15am',
  '8:40am',
  '10:20am',
  '11:35am',
  '1:05pm',
  '3:25pm',
  '5:10pm'
]

const additionalConsignmentSeeds = pairedArrivalSeeds.map(
  ([arrivalOffsetDays, status], index) => {
    const referenceNumber = ADDITIONAL_FELIXSTOWE_REFERENCE_START + index
    return {
      id: `consignment-${referenceNumber}`,
      reference: `GB-IUU-2026-${referenceNumber}`,
      importer: additionalImporters[index % additionalImporters.length],
      originCountry: additionalOrigins[index % additionalOrigins.length],
      arrivalOffsetDays,
      arrivalTime:
        additionalArrivalTimes[index % additionalArrivalTimes.length],
      commodityCodes: [
        additionalCommodityCodes[index % additionalCommodityCodes.length]
      ],
      species: additionalSpecies[index],
      declaredWeightKg:
        ADDITIONAL_FELIXSTOWE_BASE_WEIGHT_KG +
        index * ADDITIONAL_FELIXSTOWE_WEIGHT_INCREMENT_KG,
      catchCertificateCount: 1 + (index % 2),
      processingStatementCount: index % DOCUMENT_COUNT_CYCLE,
      nmdCount: index % 2,
      additionalDocumentCount: index % DOCUMENT_COUNT_CYCLE,
      status,
      riskFlags: index % 4 === 0 ? ['MISSING_EVIDENCE'] : []
    }
  }
)

const doverConsignmentSeeds = [
  {
    id: 'consignment-dover-21001',
    reference: 'GB-IUU-2026-21001',
    importer: 'Dover Seafood Imports Ltd',
    originCountry: 'France',
    arrivalOffsetDays: 1,
    arrivalTime: '8:30am',
    port: 'Dover',
    portId: 'DOVER',
    notificationStatus: 'SUBMITTED',
    commodityCodes: ['030343'],
    species: 'Skipjack tuna (Katsuwonus pelamis)',
    declaredWeightKg: 6800,
    catchCertificateCount: 1,
    processingStatementCount: 1,
    nmdCount: 0,
    additionalDocumentCount: 0,
    status: 'REQUIRES_DOCUMENT_CHECK',
    riskFlags: []
  },
  {
    id: 'consignment-dover-21002',
    reference: 'GB-IUU-2026-21002',
    importer: 'Channel Fish Traders Ltd',
    originCountry: 'Spain',
    arrivalOffsetDays: 3,
    arrivalTime: '11:45am',
    port: 'Dover',
    portId: 'DOVER',
    notificationStatus: 'SUBMITTED',
    commodityCodes: ['03048720'],
    species: 'Bluefin tuna loins',
    declaredWeightKg: 4200,
    catchCertificateCount: 1,
    processingStatementCount: 1,
    nmdCount: 0,
    additionalDocumentCount: 1,
    status: 'IN_PROGRESS',
    riskFlags: ['MISSING_EVIDENCE']
  }
]

const additionalDoverConsignmentSeeds = Array.from(
  { length: 40 },
  (_, index) => {
    const [arrivalOffsetDays, status] =
      pairedArrivalSeeds[index % pairedArrivalSeeds.length]
    const referenceNumber = ADDITIONAL_DOVER_REFERENCE_START + index
    return {
      id: `consignment-dover-${referenceNumber}`,
      reference: `GB-IUU-2026-${referenceNumber}`,
      importer: additionalImporters[index % additionalImporters.length],
      originCountry: additionalOrigins[index % additionalOrigins.length],
      arrivalOffsetDays,
      arrivalTime:
        additionalArrivalTimes[index % additionalArrivalTimes.length],
      port: 'Dover',
      portId: 'DOVER',
      notificationStatus: 'SUBMITTED',
      commodityCodes: [
        additionalCommodityCodes[index % additionalCommodityCodes.length]
      ],
      species: additionalSpecies[index % additionalSpecies.length],
      declaredWeightKg:
        ADDITIONAL_DOVER_BASE_WEIGHT_KG +
        index * ADDITIONAL_DOVER_WEIGHT_INCREMENT_KG,
      catchCertificateCount: 1 + (index % 2),
      processingStatementCount: index % DOCUMENT_COUNT_CYCLE,
      nmdCount: index % 2,
      additionalDocumentCount: index % DOCUMENT_COUNT_CYCLE,
      status,
      riskFlags: index % 4 === 0 ? ['MISSING_EVIDENCE'] : []
    }
  }
)

export default [
  ...felixstoweConsignmentSeeds,
  ...additionalConsignmentSeeds,
  ...doverConsignmentSeeds,
  ...additionalDoverConsignmentSeeds
]
