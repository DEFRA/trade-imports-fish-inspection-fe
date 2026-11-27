import { createRequire } from 'node:module'
import {
  ADDITIONAL_DOVER_BASE_WEIGHT_KG,
  ADDITIONAL_DOVER_REFERENCE_START,
  ADDITIONAL_DOVER_WEIGHT_INCREMENT_KG,
  ADDITIONAL_FELIXSTOWE_BASE_WEIGHT_KG,
  ADDITIONAL_FELIXSTOWE_REFERENCE_START,
  ADDITIONAL_FELIXSTOWE_WEIGHT_INCREMENT_KG,
  CONTAINER_SERIAL_DIGITS,
  DOCUMENT_COUNT_CYCLE,
  GENERATED_IMO_NUMBER_START,
  MULTI_COMMODITY_SEED_COUNT,
  STATUS_CHANGE_HASH_MULTIPLIER
} from './inspection-dashboard-consignment-seed-generator-controls.js'
import { STATUS_LABELS } from './services/inspection-dashboard-constants.js'
import felixstoweConsignmentSeeds from './inspection-dashboard-consignment-seeds-felixstowe.js'
import {
  ATLANTIC_SEAFOODS,
  ATLANTIC_TUNA_IMPORTS,
  HARBOUR_CATCH_IMPORTS,
  NEW_ENGLAND_SEAFOOD_INTERNATIONAL,
  NEW_ENGLAND_SEAFOOD_INTERNATIONAL_LTD,
  OCEAN_HARVEST_IMPORTS
} from './inspection-dashboard-consignment-seed-values.js'

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
const vesselNames = [
  'Northern Star',
  'Ocean Crest',
  'Silver Tide',
  'Atlantic Dawn',
  'Blue Horizon',
  'Sea Venture',
  'Mariner',
  'Ocean Spirit',
  'Westward Isle',
  'Sea Falcon',
  'Arctic Voyager',
  'Coastal Pride'
]
const importerEoris = {
  'North Atlantic Seafood Ltd': 'GB012345678901',
  [NEW_ENGLAND_SEAFOOD_INTERNATIONAL_LTD]: 'GB123456789012',
  [ATLANTIC_TUNA_IMPORTS]: 'GB234567890123',
  [HARBOUR_CATCH_IMPORTS]: 'GB345678901234',
  [OCEAN_HARVEST_IMPORTS]: 'GB456789012345',
  [ATLANTIC_SEAFOODS]: 'GB567890123456',
  [NEW_ENGLAND_SEAFOOD_INTERNATIONAL]: 'GB678901234567',
  'Frinsa UK': 'GB789012345678',
  'Dover Seafood Imports Ltd': 'GB890123456789',
  'Channel Fish Traders Ltd': 'GB901234567890'
}

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
    commodityCodes: ['030343', '03048720'],
    commoditySpecies: [
      {
        commodityCode: '030343',
        species: 'Skipjack tuna',
        weight: '3,800 kg'
      },
      {
        commodityCode: '03048720',
        species: 'Yellowfin tuna',
        weight: '3,000 kg'
      }
    ],
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
    commodityCodes: ['03048720', '16041416'],
    commoditySpecies: [
      {
        commodityCode: '03048720',
        species: 'Bluefin tuna',
        weight: '2,400 kg'
      },
      {
        commodityCode: '16041416',
        species: 'Albacore tuna',
        weight: '1,800 kg'
      }
    ],
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
    const commodityCodes =
      index < MULTI_COMMODITY_SEED_COUNT
        ? [
            additionalCommodityCodes[index % additionalCommodityCodes.length],
            additionalCommodityCodes[
              (index + 1) % additionalCommodityCodes.length
            ]
          ]
        : [additionalCommodityCodes[index % additionalCommodityCodes.length]]
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
      commodityCodes,
      ...(index < MULTI_COMMODITY_SEED_COUNT && {
        commoditySpecies: commodityCodes.map(
          (commodityCode, commodityIndex) => ({
            commodityCode,
            species:
              additionalSpecies[
                (index + commodityIndex) % additionalSpecies.length
              ],
            weight: `${new Intl.NumberFormat('en-GB').format(
              Math.round(
                (ADDITIONAL_DOVER_BASE_WEIGHT_KG +
                  index * ADDITIONAL_DOVER_WEIGHT_INCREMENT_KG) /
                  commodityCodes.length
              )
            )} kg`
          })
        )
      }),
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

const allConsignmentSeeds = [
  ...felixstoweConsignmentSeeds,
  ...additionalConsignmentSeeds,
  ...doverConsignmentSeeds,
  ...additionalDoverConsignmentSeeds
]

const getStatusChangeTime = (id) => {
  let hash = 0
  for (const character of id) {
    hash =
      (hash * STATUS_CHANGE_HASH_MULTIPLIER + character.codePointAt(0)) >>> 0
  }

  const minutesAfterEightAm = hash % (10 * 60)
  const hours = 8 + Math.floor(minutesAfterEightAm / 60)
  const minutes = minutesAfterEightAm % 60
  return `2026-11-23T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`
}

const addCurrentStatusRecentChange = (seed) => {
  const statusChangeLabel = `Inspector status changed to ${STATUS_LABELS[seed.status]}`
  const recentChanges = seed.recentChanges || []

  if (recentChanges[0]?.label === statusChangeLabel) {
    return recentChanges
  }

  return [
    {
      label: statusChangeLabel,
      actor: 'Port Health Authority',
      occurredAt: getStatusChangeTime(seed.id)
    },
    ...recentChanges
  ]
}

export default allConsignmentSeeds.map((seed, index) => {
  const importerEori = importerEoris[seed.importer]
  if (!importerEori) {
    throw new Error(`Missing mock EORI for importer ${seed.importer}`)
  }

  const generatedVesselName = `${vesselNames[index % vesselNames.length]} ${Math.floor(index / vesselNames.length) + 1}`

  return {
    ...seed,
    recentChanges: addCurrentStatusRecentChange(seed),
    vesselName:
      !seed.vesselName || seed.vesselName === 'Multiple vessels'
        ? generatedVesselName
        : seed.vesselName,
    imoNumber: seed.imoNumber || String(GENERATED_IMO_NUMBER_START + index),
    containerNumber:
      seed.containerNumber ||
      `TIFU${String(index + 1).padStart(CONTAINER_SERIAL_DIGITS, '0')}`,
    importerEori
  }
})
