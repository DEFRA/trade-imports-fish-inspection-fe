import {
  ALL_FILTER_VALUE,
  ARRIVAL_RED_TAG_THRESHOLD_DAYS,
  ARRIVAL_YELLOW_TAG_MAX_DAYS,
  GOVUK_TAG_RED,
  GOVUK_TAG_YELLOW,
  RISK_FLAG_LABELS,
  STATUS_LABELS,
  STATUS_TAG_CLASSES
} from './inspection-dashboard-constants.js'
import {
  RISK_FLAG_CODES,
  STATUS_CODES
} from '../mock-api/consignment-summaries-api.js'

const DATE_INPUT_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/

const toUtcDate = (date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )

const formatShortDate = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date)

const formatArrivalDateHeading = (isoDate) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${isoDate}T00:00:00Z`))

const formatWeightKg = (value) =>
  new Intl.NumberFormat('en-GB').format(value) + ' kg'

const parseIsoDateInput = (value) => {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) {
    return null
  }

  const match = DATE_INPUT_PATTERN.exec(normalizedValue)
  if (!match) {
    return null
  }

  const { year, month, day } = match.groups
  const parsedDate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  )
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== Number(year) ||
    parsedDate.getUTCMonth() !== Number(month) - 1 ||
    parsedDate.getUTCDate() !== Number(day)
  ) {
    return null
  }

  return parsedDate
}

const toIsoDate = (date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const mapDaysUntilArrivalTagClass = (daysUntilArrival) => {
  if (daysUntilArrival < ARRIVAL_RED_TAG_THRESHOLD_DAYS) {
    return GOVUK_TAG_RED
  }
  if (daysUntilArrival <= ARRIVAL_YELLOW_TAG_MAX_DAYS) {
    return GOVUK_TAG_YELLOW
  }

  return 'govuk-tag--green'
}

const formatArrivalTiming = (daysUntilArrival) => {
  if (daysUntilArrival === 0) {
    return 'Arrival today'
  }
  if (daysUntilArrival === 1) {
    return 'Arrival in 1 day'
  }
  if (daysUntilArrival > 1) {
    return `Arrival in ${daysUntilArrival} days`
  }
  if (daysUntilArrival === -1) {
    return 'Overdue by 1 day'
  }

  return `Overdue by ${Math.abs(daysUntilArrival)} days`
}

const buildDocumentsProvidedText = (consignment) => {
  const documentEntries = [
    {
      singular: 'Catch certificate',
      plural: 'Catch certificates',
      count: consignment.catchCertificateCount
    },
    {
      singular: 'Processing statement',
      plural: 'Processing statements',
      count: consignment.processingStatementCount
    },
    {
      singular: 'Non-manipulation declaration',
      plural: 'Non-manipulation declarations',
      count: consignment.nmdCount
    },
    {
      singular: 'Additional document',
      plural: 'Additional documents',
      count: consignment.additionalDocumentCount
    }
  ]

  return documentEntries
    .filter((entry) => entry.count > 0)
    .map(
      (entry) =>
        `${entry.count === 1 ? entry.singular : entry.plural} (${entry.count})`
    )
}

const buildCommoditySpeciesSummary = (consignment) => {
  const commoditySpecies = consignment.commoditySpecies
  if (!Array.isArray(commoditySpecies) || !commoditySpecies.length) {
    return null
  }

  const groupsByCode = new Map()
  for (const item of commoditySpecies) {
    if (!groupsByCode.has(item.commodityCode)) {
      groupsByCode.set(item.commodityCode, {
        commodityCode: item.commodityCode,
        species: []
      })
    }
    groupsByCode.get(item.commodityCode).species.push(item)
  }
  const groups = Array.from(groupsByCode.values())

  return {
    speciesCount: commoditySpecies.length,
    commodityCount: groups.length,
    totalWeightDisplay: formatWeightKg(consignment.declaredWeightKg),
    initialGroup: groups[0],
    remainingGroups: groups.slice(1)
  }
}

const buildStatusOptions = () => [
  { value: ALL_FILTER_VALUE, text: 'All statuses' },
  ...STATUS_CODES.map((statusCode) => ({
    value: statusCode,
    text: STATUS_LABELS[statusCode]
  }))
]

const buildRiskOptions = () => [
  { value: ALL_FILTER_VALUE, text: 'All risk indicators' },
  ...RISK_FLAG_CODES.map((riskCode) => ({
    value: riskCode,
    text: RISK_FLAG_LABELS[riskCode]
  }))
]

const buildOptionsForValues = (values, allOptionLabel) => [
  { value: ALL_FILTER_VALUE, text: allOptionLabel },
  ...values.map((value) => ({ value, text: value }))
]

const mapConsignmentForView = (consignment) => ({
  id: consignment.id,
  reference: consignment.reference,
  originCountry: consignment.originCountry,
  importer: consignment.importer,
  estimatedArrivalDateDisplay: formatShortDate(consignment.estimatedArrival),
  estimatedArrivalTimeDisplay: consignment.arrivalTime,
  estimatedArrivalIsoDate: toIsoDate(consignment.estimatedArrival),
  daysUntilArrival: consignment.daysUntilArrival,
  arrivalTimingLabel: formatArrivalTiming(consignment.daysUntilArrival),
  daysUntilArrivalTagClass: mapDaysUntilArrivalTagClass(
    consignment.daysUntilArrival
  ),
  commodityCodes: consignment.commodityCodes,
  commoditySpeciesSummary: buildCommoditySpeciesSummary(consignment),
  species: consignment.species,
  declaredWeightDisplay: formatWeightKg(consignment.declaredWeightKg),
  documentsProvidedLines: buildDocumentsProvidedText(consignment),
  statusLabel:
    consignment.statusLabelOverride || STATUS_LABELS[consignment.status],
  statusTagClass:
    consignment.statusTagClassOverride ||
    STATUS_TAG_CLASSES[consignment.status],
  riskFlags: consignment.riskFlags.map((riskFlagCode) => ({
    code: riskFlagCode,
    text: RISK_FLAG_LABELS[riskFlagCode]
  }))
})

export {
  buildOptionsForValues,
  buildRiskOptions,
  buildStatusOptions,
  formatArrivalDateHeading,
  mapConsignmentForView,
  parseIsoDateInput,
  toUtcDate
}
