import { vi } from 'vitest'
import { createServer } from '#/server/server.js'
import {
  homeController,
  accountController,
  consignmentController
} from './controller.js'

vi.hoisted(() => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('ENVIRONMENT', 'prod')
  vi.stubEnv('AUTH_MODE', undefined)
  vi.stubEnv('SESSION_CACHE_ENGINE', 'memory')
  vi.stubEnv('LOG_ENABLED', 'false')
})

let server

beforeAll(async () => {
  server = await createServer()
  await server.initialize()
})

afterAll(async () => {
  await server?.stop({ timeout: 0 })
  vi.unstubAllEnvs()
})

test('without opt-in, protected pages deny access instead of redirecting to a missing picker', async () => {
  expect(server.table().some(({ path }) => path === '/mock-auth')).toBe(false)
  expect((await server.inject('/mock-auth')).statusCode).toBe(404)
  for (const url of [
    '/inspections',
    '/account',
    '/inspection/GB-IUU-2026-11002'
  ]) {
    const response = await server.inject(url)
    expect(response.statusCode).toBe(403)
    expect(response.payload).toContain('sign-in is not available')
  }
})

test('turning off the picker also disables previously signed-in PHA sessions', () => {
  const request = {
    params: { reference: 'GB-IUU-2026-21001' },
    yar: { get: () => ({ roles: ['PHA'], portId: 'DOVER' }) }
  }
  for (const controller of [
    homeController,
    accountController,
    consignmentController
  ]) {
    const code = vi.fn()
    controller.handler(request, { view: () => ({ code }) })
    expect(code).toHaveBeenCalledWith(403)
  }
})
