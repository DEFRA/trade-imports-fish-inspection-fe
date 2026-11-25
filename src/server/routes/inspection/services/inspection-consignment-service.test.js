import { buildInspectionConsignmentViewModel } from './inspection-consignment-service.js'

describe('inspection consignment view model', () => {
  test('shows document references including the exporting country code', () => {
    const consignment = buildInspectionConsignmentViewModel(
      'DOVER',
      'GB-IUU-2026-21002',
      new Date('2026-11-18T12:00:00.000Z')
    )

    expect(consignment.evidenceRows[0]).toMatchObject({
      type: 'Catch certificates',
      count: 1,
      status: 'Provided',
      details: 'CC-ES-21002-01',
      references: ['CC-ES-21002-01']
    })
  })

  test('does not show references for documents that were not supplied', () => {
    const consignment = buildInspectionConsignmentViewModel(
      'DOVER',
      'GB-IUU-2026-21002',
      new Date('2026-11-18T12:00:00.000Z')
    )

    expect(consignment.evidenceRows[2]).toMatchObject({
      status: 'Not provided',
      details: 'None supplied',
      references: []
    })
  })
})
