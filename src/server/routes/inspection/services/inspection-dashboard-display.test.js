import {
  mapConsignmentForView,
  toUtcDate
} from './inspection-dashboard-display.js'

const withTimeZone = (timeZone, callback) => {
  const originalTimeZone = process.env.TZ
  process.env.TZ = timeZone

  try {
    return callback()
  } finally {
    if (originalTimeZone === undefined) {
      delete process.env.TZ
    } else {
      process.env.TZ = originalTimeZone
    }
  }
}

describe('inspection dashboard display date handling', () => {
  test('preserves UTC calendar dates in a negative-offset timezone', () => {
    withTimeZone('America/Los_Angeles', () => {
      const arrival = new Date('2026-11-18T00:00:00.000Z')
      const consignment = mapConsignmentForView({
        id: 'consignment-1',
        reference: 'GB-IUU-2026-1',
        importer: 'Example importer',
        originCountry: 'Iceland',
        estimatedArrival: arrival,
        arrivalTime: '9:00am',
        daysUntilArrival: 0,
        commodityCodes: ['030343'],
        commoditySpecies: [
          { commodityCode: '030343', species: 'Tuna', weight: '100 kg' }
        ],
        species: 'Tuna',
        declaredWeightKg: 100,
        catchCertificateCount: 1,
        processingStatementCount: 0,
        nmdCount: 0,
        additionalDocumentCount: 0,
        status: 'IN_PROGRESS',
        riskFlags: []
      })

      expect(toUtcDate(arrival).toISOString()).toBe('2026-11-18T00:00:00.000Z')
      expect(consignment.estimatedArrivalDateDisplay).toBe('18 Nov 2026')
      expect(consignment.estimatedArrivalIsoDate).toBe('2026-11-18')
    })
  })
})
