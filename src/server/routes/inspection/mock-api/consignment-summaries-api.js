import consignmentSummarySeeds from '../inspection-dashboard-consignment-seeds.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * @typedef {'REQUIRES_DOCUMENT_CHECK' | 'IN_PROGRESS' | 'REQUEST_ADDITIONAL_INFORMATION' | 'REFERRED_TO_MMO' | 'COMPLETED' | 'REQUIRES_PHYSICAL_INSPECTION' | 'APPEAL_UNDER_REVIEW' | 'REFERRED_TO_ENFORCEMENT' | 'REJECTED' | 'CLOSED'} ConsignmentStatus
 */

/**
 * @typedef {'COMMODITY_MISMATCH' | 'WEIGHT_MISMATCH' | 'MISSING_EVIDENCE' | 'IMPORTER_DECLARATION_MISSING' | 'TRANSPORT_INFORMATION_MISSING'} RiskFlag
 */

/**
 * @typedef {Object} ConsignmentSummary
 * @property {string} id
 * @property {string} reference
 * @property {string} importer
 * @property {string} originCountry
 * @property {Date} estimatedArrival
 * @property {Date|null} completedAt
 * @property {boolean} isCompletedToday
 * @property {string} arrivalTime
 * @property {number} daysUntilArrival
 * @property {string[]} commodityCodes
 * @property {{commodityCode: string, species: string, weight: string}[]} commoditySpecies
 * @property {string} species
 * @property {number} declaredWeightKg
 * @property {number} catchCertificateCount
 * @property {number} processingStatementCount
 * @property {number} nmdCount
 * @property {number} additionalDocumentCount
 * @property {ConsignmentStatus} status
 * @property {RiskFlag[]} riskFlags
 * @property {string} riskNotes
 */

const STATUS_CODES = [
  'REQUIRES_DOCUMENT_CHECK',
  'IN_PROGRESS',
  'REQUEST_ADDITIONAL_INFORMATION',
  'REFERRED_TO_MMO',
  'COMPLETED',
  'REQUIRES_PHYSICAL_INSPECTION',
  'APPEAL_UNDER_REVIEW',
  'REFERRED_TO_ENFORCEMENT',
  'REJECTED',
  'CLOSED'
]

const RISK_FLAG_CODES = [
  'COMMODITY_MISMATCH',
  'WEIGHT_MISMATCH',
  'MISSING_EVIDENCE',
  'IMPORTER_DECLARATION_MISSING',
  'TRANSPORT_INFORMATION_MISSING'
]

const statusCodeSet = new Set(STATUS_CODES)
const riskFlagCodeSet = new Set(RISK_FLAG_CODES)

const toUtcDate = (date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

const addDays = (date, dayOffset) => {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + dayOffset)
  return nextDate
}

const getDifferenceInDays = (laterDate, earlierDate) => {
  return Math.round(
    (laterDate.getTime() - earlierDate.getTime()) / MILLISECONDS_PER_DAY
  )
}

const assertPositiveInteger = (value, fieldName, reference) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${fieldName} for consignment ${reference}`)
  }
}

const assertSeedIsObject = (seed) => {
  if (!seed || typeof seed !== 'object') {
    throw new Error('Each consignment seed must be an object')
  }
}

const assertRequiredFields = (seed) => {
  if (
    !seed.id ||
    !seed.reference ||
    !seed.importer ||
    !seed.originCountry ||
    !seed.species
  ) {
    throw new Error(
      `Missing required consignment data for ${seed.reference || seed.id || 'unknown reference'}`
    )
  }
}

const assertArrivalDate = (seed) => {
  if (!seed.arrivalDate && !Number.isInteger(seed.arrivalOffsetDays)) {
    throw new Error(
      `arrivalOffsetDays must be an integer for ${seed.reference}`
    )
  }

  if (
    seed.arrivalDate &&
    Number.isNaN(Date.parse(seed.arrivalDate + 'T00:00:00Z'))
  ) {
    throw new Error(`Invalid arrivalDate for ${seed.reference}`)
  }
}

const assertCommodityCodes = (seed) => {
  if (!Array.isArray(seed.commodityCodes) || seed.commodityCodes.length === 0) {
    throw new Error(
      `commodityCodes must be a non-empty array for ${seed.reference}`
    )
  }
}

const assertStatus = (seed) => {
  if (!statusCodeSet.has(seed.status)) {
    throw new Error(`Invalid status ${seed.status} for ${seed.reference}`)
  }
}

const assertRiskFlags = (seed) => {
  if (!Array.isArray(seed.riskFlags)) {
    throw new TypeError(`riskFlags must be an array for ${seed.reference}`)
  }

  for (const riskFlag of seed.riskFlags) {
    if (!riskFlagCodeSet.has(riskFlag)) {
      throw new Error(`Invalid risk flag ${riskFlag} for ${seed.reference}`)
    }
  }
}

const assertDocumentCounts = (seed) => {
  assertPositiveInteger(
    seed.declaredWeightKg,
    'declaredWeightKg',
    seed.reference
  )
  assertPositiveInteger(
    seed.catchCertificateCount,
    'catchCertificateCount',
    seed.reference
  )
  assertPositiveInteger(
    seed.processingStatementCount,
    'processingStatementCount',
    seed.reference
  )
  assertPositiveInteger(seed.nmdCount, 'nmdCount', seed.reference)
  assertPositiveInteger(
    seed.additionalDocumentCount,
    'additionalDocumentCount',
    seed.reference
  )
}

const assertSeedValid = (seed) => {
  assertSeedIsObject(seed)
  assertRequiredFields(seed)
  assertArrivalDate(seed)
  assertCommodityCodes(seed)
  assertStatus(seed)
  assertRiskFlags(seed)
  assertDocumentCounts(seed)
}

const getCompletedAt = (seed, startOfToday) => {
  if (Number.isInteger(seed.completedOffsetDays)) {
    return addDays(startOfToday, seed.completedOffsetDays)
  }

  if (seed.completedAt) {
    return new Date(seed.completedAt)
  }

  return null
}

const buildConsignmentSummary = (seed, startOfToday) => {
  assertSeedValid(seed)
  const estimatedArrival = seed.arrivalDate
    ? new Date(seed.arrivalDate + 'T00:00:00Z')
    : addDays(startOfToday, seed.arrivalOffsetDays)
  const completedAt = getCompletedAt(seed, startOfToday)
  const commoditySpecies = seed.commoditySpecies || [
    {
      commodityCode: seed.commodityCodes[0],
      species: seed.species,
      weight:
        new Intl.NumberFormat('en-GB').format(seed.declaredWeightKg) + ' kg'
    }
  ]
  const commodityCodes = [
    ...new Set(commoditySpecies.map((item) => item.commodityCode))
  ]

  return {
    id: seed.id,
    reference: seed.reference,
    importer: seed.importer,
    originCountry: seed.originCountry,
    estimatedArrival,
    completedAt,
    isCompletedToday:
      seed.status === 'COMPLETED' &&
      completedAt !== null &&
      toUtcDate(completedAt).getTime() === startOfToday.getTime(),
    arrivalTime: seed.arrivalTime,
    daysUntilArrival: getDifferenceInDays(estimatedArrival, startOfToday),
    commodityCodes,
    commoditySpecies,
    species: seed.species,
    declaredWeightKg: seed.declaredWeightKg,
    catchCertificateCount: seed.catchCertificateCount,
    processingStatementCount: seed.processingStatementCount,
    nmdCount: seed.nmdCount,
    additionalDocumentCount: seed.additionalDocumentCount,
    status: seed.status,
    riskFlags: seed.riskFlags,
    portId: seed.portId || 'FELIXSTOWE',
    notificationStatus: seed.notificationStatus || 'SUBMITTED',
    riskNotes: seed.riskNotes || '',
    warningText: seed.warningText,
    assessmentSummary: seed.assessmentSummary,
    port: seed.port,
    containerNumber: seed.containerNumber,
    vesselName: seed.vesselName
  }
}

/**
 * @param {Date} [today]
 * @returns {ConsignmentSummary[]}
 */
const listConsignmentSummaries = (today = new Date(), portId) => {
  const startOfToday = toUtcDate(today)
  return consignmentSummarySeeds
    .filter(
      (seed) =>
        (seed?.portId || 'FELIXSTOWE') === portId &&
        (seed?.notificationStatus || 'SUBMITTED') === 'SUBMITTED'
    )
    .map((seed) => buildConsignmentSummary(seed, startOfToday))
}

const mockConsignmentSummariesApi = {
  listConsignmentSummaries
}

export { STATUS_CODES, RISK_FLAG_CODES, mockConsignmentSummariesApi }
