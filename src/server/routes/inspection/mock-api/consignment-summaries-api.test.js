import { vi } from 'vitest'

const PORT_ID = 'FELIXSTOWE'

const withTimeZone = async (timeZone, callback) => {
  const originalTimeZone = process.env.TZ
  process.env.TZ = timeZone

  try {
    return await callback()
  } finally {
    if (originalTimeZone === undefined) {
      delete process.env.TZ
    } else {
      process.env.TZ = originalTimeZone
    }
  }
}

const createSeed = () => ({
  id: 'consignment-1',
  reference: 'GB-IUU-2026-1',
  portId: PORT_ID,
  importer: 'Example importer',
  originCountry: 'Iceland',
  arrivalOffsetDays: 0,
  arrivalTime: '9:00am',
  commodityCodes: ['030343'],
  species: 'Tuna',
  declaredWeightKg: 100,
  catchCertificateCount: 1,
  processingStatementCount: 0,
  nmdCount: 0,
  additionalDocumentCount: 0,
  status: 'COMPLETED',
  riskFlags: []
})

const loadApiWithSeeds = async (seeds) => {
  vi.resetModules()
  vi.doMock('../inspection-dashboard-consignment-seeds.js', () => ({
    default: seeds
  }))

  const { mockConsignmentSummariesApi } =
    await import('./consignment-summaries-api.js')

  vi.doUnmock('../inspection-dashboard-consignment-seeds.js')
  return {
    listConsignmentSummaries: (portId = PORT_ID, today = new Date()) =>
      mockConsignmentSummariesApi.listConsignmentSummaries(portId, today)
  }
}

afterEach(() => {
  vi.doUnmock('../inspection-dashboard-consignment-seeds.js')
  vi.resetModules()
})

describe('#mockConsignmentSummariesApi', () => {
  test('builds a summary and uses the supplied completion offset', async () => {
    const seed = {
      ...createSeed(),
      arrivalOffsetDays: 2,
      completedOffsetDays: 0
    }
    const api = await loadApiWithSeeds([seed])
    const today = new Date('2026-11-18T12:00:00.000Z')

    const [summary] = api.listConsignmentSummaries(PORT_ID, today)

    expect(summary.estimatedArrival.toISOString()).toBe(
      '2026-11-20T00:00:00.000Z'
    )
    expect(summary.completedAt.toISOString()).toBe('2026-11-18T00:00:00.000Z')
    expect(summary.isCompletedToday).toBe(true)
    expect(summary.commoditySpecies).toEqual([
      {
        commodityCode: '030343',
        species: 'Tuna',
        weight: '100 kg'
      }
    ])
    expect(today.toISOString()).toBe('2026-11-18T12:00:00.000Z')
  })

  test('recognizes UTC-midnight completion dates in a negative-offset timezone', async () => {
    await withTimeZone('America/Los_Angeles', async () => {
      const seed = { ...createSeed(), completedOffsetDays: 0 }
      const api = await loadApiWithSeeds([seed])
      const [summary] = api.listConsignmentSummaries(
        PORT_ID,
        new Date('2026-11-18T12:00:00.000Z')
      )

      expect(summary.completedAt.toISOString()).toBe('2026-11-18T00:00:00.000Z')
      expect(summary.isCompletedToday).toBe(true)
    })
  })

  test('uses an explicit completion timestamp when no integer offset is supplied', async () => {
    const seed = {
      ...createSeed(),
      completedOffsetDays: 1.5,
      completedAt: '2026-11-17T10:00:00.000Z'
    }
    const api = await loadApiWithSeeds([seed])

    const [summary] = api.listConsignmentSummaries(
      PORT_ID,
      new Date('2026-11-18T12:00:00.000Z')
    )

    expect(summary.completedAt.toISOString()).toBe('2026-11-17T10:00:00.000Z')
    expect(summary.isCompletedToday).toBe(false)
  })

  test('leaves completion unset when the seed has no completion date', async () => {
    const api = await loadApiWithSeeds([createSeed()])

    const [summary] = api.listConsignmentSummaries(
      PORT_ID,
      new Date('2026-11-18T12:00:00.000Z')
    )

    expect(summary.completedAt).toBeNull()
    expect(summary.isCompletedToday).toBe(false)
  })

  test('filters summaries by port', async () => {
    const otherPortSeed = {
      ...createSeed(),
      id: 'consignment-2',
      reference: 'GB-IUU-2026-2',
      portId: 'GRIMSBY'
    }
    const api = await loadApiWithSeeds([createSeed(), otherPortSeed])

    expect(api.listConsignmentSummaries('GRIMSBY')).toHaveLength(1)
  })

  test.each([
    [null, 'Each consignment seed must be an object'],
    ['not-an-object', 'Each consignment seed must be an object']
  ])('rejects invalid seed values: %s', async (seed, message) => {
    const api = await loadApiWithSeeds([seed])

    expect(() => api.listConsignmentSummaries()).toThrow(message)
  })

  test.each([
    ['id', undefined, 'GB-IUU-2026-1'],
    ['reference', undefined, 'consignment-1'],
    ['importer', '', 'GB-IUU-2026-1'],
    ['originCountry', '', 'GB-IUU-2026-1'],
    ['species', '', 'GB-IUU-2026-1']
  ])(
    'rejects a missing required field: %s',
    async (field, value, reference) => {
      const seed = createSeed()
      seed[field] = value
      const api = await loadApiWithSeeds([seed])

      expect(() => api.listConsignmentSummaries()).toThrow(
        `Missing required consignment data for ${reference}`
      )
    }
  )

  test('uses the unknown-reference fallback when required identity fields are absent', async () => {
    const seed = createSeed()
    delete seed.id
    delete seed.reference
    const api = await loadApiWithSeeds([seed])

    expect(() => api.listConsignmentSummaries()).toThrow(
      'Missing required consignment data for unknown reference'
    )
  })

  test('rejects a seed without an arrival date or integer offset', async () => {
    const seed = createSeed()
    delete seed.arrivalOffsetDays
    const api = await loadApiWithSeeds([seed])

    expect(() => api.listConsignmentSummaries()).toThrow(
      'arrivalOffsetDays must be an integer for GB-IUU-2026-1'
    )
  })

  test('rejects an invalid explicit arrival date', async () => {
    const seed = { ...createSeed(), arrivalDate: 'not-a-date' }
    const api = await loadApiWithSeeds([seed])

    expect(() => api.listConsignmentSummaries()).toThrow(
      'Invalid arrivalDate for GB-IUU-2026-1'
    )
  })

  test.each([undefined, []])(
    'rejects invalid commodity codes: %s',
    async (commodityCodes) => {
      const seed = { ...createSeed(), commodityCodes }
      const api = await loadApiWithSeeds([seed])

      expect(() => api.listConsignmentSummaries()).toThrow(
        'commodityCodes must be a non-empty array for GB-IUU-2026-1'
      )
    }
  )

  test('rejects a status that is not recognised', async () => {
    const seed = { ...createSeed(), status: 'UNKNOWN' }
    const api = await loadApiWithSeeds([seed])

    expect(() => api.listConsignmentSummaries()).toThrow(
      'Invalid status UNKNOWN for GB-IUU-2026-1'
    )
  })

  test('throws a TypeError when risk flags are not an array', async () => {
    const seed = { ...createSeed(), riskFlags: null }
    const api = await loadApiWithSeeds([seed])

    expect(() => api.listConsignmentSummaries()).toThrow(
      new TypeError('riskFlags must be an array for GB-IUU-2026-1')
    )
  })

  test('rejects a risk flag that is not recognised', async () => {
    const seed = { ...createSeed(), riskFlags: ['UNKNOWN'] }
    const api = await loadApiWithSeeds([seed])

    expect(() => api.listConsignmentSummaries()).toThrow(
      'Invalid risk flag UNKNOWN for GB-IUU-2026-1'
    )
  })

  test.each([
    ['declaredWeightKg', -1],
    ['catchCertificateCount', 1.5],
    ['processingStatementCount', -1],
    ['nmdCount', -1],
    ['additionalDocumentCount', -1]
  ])('rejects an invalid %s', async (field, value) => {
    const seed = { ...createSeed(), [field]: value }
    const api = await loadApiWithSeeds([seed])

    expect(() => api.listConsignmentSummaries()).toThrow(
      `Invalid ${field} for consignment GB-IUU-2026-1`
    )
  })
})
