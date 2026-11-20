import consignmentSeeds from './inspection-dashboard-consignment-seeds.js'

describe('inspection dashboard consignment seeds', () => {
  test('preserves fixture groups, order, and generated values', () => {
    expect(consignmentSeeds).toHaveLength(84)
    expect(consignmentSeeds[0].id).toBe('consignment-11001')

    expect(consignmentSeeds[21]).toMatchObject({
      id: 'consignment-11022',
      reference: 'GB-IUU-2026-11022',
      declaredWeightKg: 3200,
      arrivalOffsetDays: -1
    })
    expect(consignmentSeeds[22]).toMatchObject({
      id: 'consignment-11023',
      declaredWeightKg: 3625,
      arrivalOffsetDays: 105
    })

    expect(consignmentSeeds[42].id).toBe('consignment-dover-21001')
    expect(consignmentSeeds[44]).toMatchObject({
      id: 'consignment-dover-21004',
      reference: 'GB-IUU-2026-21004',
      declaredWeightKg: 3000,
      arrivalOffsetDays: -1
    })
    expect(consignmentSeeds[83]).toMatchObject({
      id: 'consignment-dover-21043',
      declaredWeightKg: 16650
    })
  })
})
