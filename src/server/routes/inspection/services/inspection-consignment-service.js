import { mockConsignmentSummariesApi } from '../mock-api/consignment-summaries-api.js'
import { mapConsignmentForView } from './inspection-dashboard-display.js'

const EVIDENCE_TYPES = [
  { type: 'Catch certificates', countKey: 'catchCertificateCount' },
  { type: 'Processing statements', countKey: 'processingStatementCount' },
  { type: 'Non-Manipulation Document (NMD)', countKey: 'nmdCount' },
  { type: 'Additional documents', countKey: 'additionalDocumentCount' }
]

const NOT_AVAILABLE = 'Not available'

const COUNTRY_CODES = {
  Canada: 'CA',
  Chile: 'CL',
  Ecuador: 'EC',
  France: 'FR',
  Ghana: 'GH',
  Iceland: 'IS',
  India: 'IN',
  Morocco: 'MA',
  Norway: 'NO',
  Peru: 'PE',
  Portugal: 'PT',
  Seychelles: 'SC',
  Spain: 'ES'
}

const getDocumentReferences = (consignment, prefix, count) => {
  const country = consignment.originCountry.split(',')[0].trim()
  const countryCode = COUNTRY_CODES[country] || 'XX'
  const consignmentNumber = consignment.reference.split('-').at(-1)

  return Array.from(
    { length: count },
    (_, index) =>
      `${prefix}-${countryCode}-${consignmentNumber}-${String(index + 1).padStart(2, '0')}`
  )
}

const buildEvidenceRows = (consignment) =>
  EVIDENCE_TYPES.map(({ type, countKey }, index) => {
    const count = consignment[countKey] ?? 0
    const references =
      count > 0
        ? getDocumentReferences(
            consignment,
            ['CC', 'PS', 'NMD', 'DOC'][index],
            count
          )
        : []
    return {
      type,
      count,
      status: count > 0 ? 'Provided' : 'Not provided',
      statusClass: count > 0 ? 'govuk-tag--green' : 'govuk-tag--grey',
      details: count > 0 ? references.join(', ') : 'None supplied',
      references
    }
  })

const parseWeightKg = (weight) => Number(String(weight).replace(/[^0-9.]/g, ''))

const formatWeightKg = (value) =>
  `${new Intl.NumberFormat('en-GB').format(value)} kg`

const buildWeightGroup = (group) => {
  const subtotal = group.species.reduce(
    (total, item) => total + parseWeightKg(item.weight),
    0
  )

  return {
    code: group.commodityCode,
    species: group.species.map((item) => ({
      name: item.species,
      notificationWeight: item.weight,
      catchCertificateWeight: NOT_AVAILABLE,
      processingStatementWeight: NOT_AVAILABLE,
      nonManipulationDeclarationWeight: NOT_AVAILABLE
    })),
    subtotals: {
      notificationWeight: formatWeightKg(subtotal),
      catchCertificateWeight: NOT_AVAILABLE,
      processingStatementWeight: NOT_AVAILABLE,
      nonManipulationDeclarationWeight: NOT_AVAILABLE
    }
  }
}

const buildCommodityWeightComparison = (summary) => {
  if (!summary) {
    return null
  }

  return {
    commodityCount: summary.commodityCount,
    speciesCount: summary.speciesCount,
    totalWeight: summary.totalWeightDisplay,
    groups: [summary.initialGroup, ...summary.remainingGroups].map(
      buildWeightGroup
    )
  }
}

const buildRecentChange = (consignment, view) => {
  const recentChange = consignment.recentChanges?.[0]

  if (recentChange) {
    return {
      label: { text: recentChange.label },
      ...(recentChange.description && { text: recentChange.description }),
      ...(recentChange.actor && { byline: { text: recentChange.actor } }),
      datetime: {
        timestamp: new Date(recentChange.occurredAt).toISOString(),
        format: 'D MMMM YYYY [at] h:mma'
      },
      ...(recentChange.completionCertificate && {
        completionCertificate: true
      })
    }
  }

  return {
    label: { text: view.statusLabel },
    ...(consignment.completedAt && {
      datetime: {
        timestamp: consignment.completedAt.toISOString(),
        format: 'D MMMM YYYY [at] h:mma'
      }
    })
  }
}

const buildProductDescription = (consignment) =>
  [
    ...new Set((consignment.commoditySpecies ?? []).map((item) => item.species))
  ].join(', ')

const buildInspectionConsignmentViewModel = (
  portId,
  reference,
  today = new Date()
) => {
  const consignment = mockConsignmentSummariesApi
    .listConsignmentSummaries(portId, today)
    .find((item) => item.reference === reference)

  if (!consignment) {
    return null
  }

  const view = mapConsignmentForView(consignment)

  return {
    ...view,
    statusTagText: view.statusLabel,
    arrivalOffsetDays: view.daysUntilArrival,
    arrivalDateDisplay: view.estimatedArrivalDateDisplay,
    arrivalTime: view.estimatedArrivalTimeDisplay,
    port:
      consignment.port ||
      (consignment.portId === 'DOVER' ? 'Dover' : 'Felixstowe'),
    importerEori: consignment.importerEori,
    declaredWeight: view.declaredWeightDisplay,
    productDescription: buildProductDescription(consignment),
    vesselName: consignment.vesselName,
    imoNumber: consignment.imoNumber,
    containerNumber: consignment.containerNumber,
    exportingCountry: view.originCountry,
    showDocumentInsightsWarning: view.riskFlags.length > 0,
    documentInsightsWarningText:
      consignment.warningText ||
      consignment.riskNotes ||
      `${view.riskFlags.map((riskFlag) => riskFlag.text).join(', ')}.`,
    evidenceRows: buildEvidenceRows(consignment),
    commodityWeightComparison: buildCommodityWeightComparison(
      view.commoditySpeciesSummary
    ),
    recentChange: buildRecentChange(consignment, view)
  }
}

export { buildInspectionConsignmentViewModel }
