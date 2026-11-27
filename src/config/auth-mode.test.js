import { vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
})

test.each([
  ['dev', undefined, 'mock'],
  ['test', undefined, 'mock'],
  ['perf-test', undefined, 'mock'],
  ['ext-test', undefined, 'mock'],
  ['prod', undefined, 'disabled'],
  ['another-test', undefined, 'disabled'],
  [undefined, undefined, 'disabled'],
  ['ext-test', 'disabled', 'disabled']
])(
  'ENVIRONMENT=%s and AUTH_MODE=%s resolve to %s',
  async (environment, override, expected) => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ENVIRONMENT', environment)
    vi.stubEnv('AUTH_MODE', override)
    vi.resetModules()
    const { config } = await import('./config.js')
    expect(config.get('authMode')).toBe(expected)
  }
)
