import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'

describe('#homeController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })

    expect(result).toEqual(expect.stringContaining('Dashboard |'))
    expect(result).toEqual(expect.stringContaining('Inspection work queue'))
    expect(result).toEqual(expect.stringContaining('GB-IUU-2026-11002'))
    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should provide the inspection dashboard at the versioned dashboard route', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/part2/v4/inspections'
    })

    expect(result).toEqual(expect.stringContaining('Inspection work queue'))
    expect(statusCode).toBe(statusCodes.ok)
  })
})
