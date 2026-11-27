import consignmentSeeds from './inspection-dashboard-consignment-seeds.js'
import { STATUS_LABELS } from './services/inspection-dashboard-constants.js'

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

  test('provides unique vessel IMOs and containers and consistent importer EORIs', () => {
    const eoriByImporter = new Map()
    const containerNumbers = new Set()
    const imoNumbers = new Set()

    for (const seed of consignmentSeeds) {
      expect(seed.vesselName).toBeTruthy()
      expect(seed.imoNumber).toMatch(/^\d{7}$/)
      expect(imoNumbers.has(seed.imoNumber)).toBe(false)
      imoNumbers.add(seed.imoNumber)
      expect(seed.importerEori).toMatch(/^GB\d{12}$/)
      expect(seed.containerNumber).toBeTruthy()
      expect(containerNumbers.has(seed.containerNumber)).toBe(false)
      containerNumbers.add(seed.containerNumber)

      const existingEori = eoriByImporter.get(seed.importer)
      if (existingEori) {
        expect(seed.importerEori).toBe(existingEori)
      } else {
        eoriByImporter.set(seed.importer, seed.importerEori)
      }
    }
  })

  test('includes a recent change matching each consignment current status', () => {
    const statusChangeTimes = new Set()

    for (const seed of consignmentSeeds) {
      expect(seed.recentChanges[0]).toMatchObject({
        label: `Inspector status changed to ${STATUS_LABELS[seed.status]}`,
        actor: 'Port Health Authority'
      })
      expect(Number.isNaN(Date.parse(seed.recentChanges[0].occurredAt))).toBe(
        false
      )
      statusChangeTimes.add(seed.recentChanges[0].occurredAt)
    }

    expect(statusChangeTimes.size).toBeGreaterThan(50)
  })

  test('includes five import notifications with two to seven commodity codes', () => {
    const updatedSeeds = consignmentSeeds.slice(0, 5)

    expect(updatedSeeds).toHaveLength(5)
    for (const seed of updatedSeeds) {
      expect(seed.commodityCodes.length).toBeGreaterThanOrEqual(2)
      expect(seed.commodityCodes.length).toBeLessThanOrEqual(7)
      expect(seed.commoditySpecies).toHaveLength(seed.commodityCodes.length)
      expect(
        new Set(seed.commoditySpecies.map(({ species }) => species)).size
      ).toBeGreaterThan(1)
      expect(
        seed.commoditySpecies.map(({ commodityCode }) => commodityCode)
      ).toEqual(seed.commodityCodes)
    }
  })

  test('includes five Dover notifications with multiple commodity codes', () => {
    const doverSeeds = consignmentSeeds.filter((seed) =>
      seed.id.startsWith('consignment-dover-')
    )
    const updatedSeeds = doverSeeds.slice(0, 5)

    expect(updatedSeeds).toHaveLength(5)
    for (const seed of updatedSeeds) {
      expect(seed.commodityCodes.length).toBeGreaterThanOrEqual(2)
      expect(seed.commodityCodes.length).toBeLessThanOrEqual(7)
      expect(seed.commoditySpecies).toHaveLength(seed.commodityCodes.length)
      expect(
        new Set(seed.commoditySpecies.map(({ species }) => species)).size
      ).toBeGreaterThan(1)
      expect(
        seed.commoditySpecies.map(({ commodityCode }) => commodityCode)
      ).toEqual(seed.commodityCodes)
    }
  })
})
