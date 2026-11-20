import { vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('#/config/config.js')
  vi.resetModules()
})

test('does not register or serve mock authentication in production', async () => {
  vi.doMock('#/config/config.js', () => ({
    config: {
      get: () => true
    }
  }))

  const [{ home }, { mockAuthController }] = await Promise.all([
    import('./index.js'),
    import('./controller.js')
  ])
  const routes = []
  home.plugin.register({
    route: (registeredRoutes) => routes.push(...registeredRoutes)
  })

  expect(routes.map(({ path }) => path)).not.toContain('/mock-auth')

  const response = { code: vi.fn().mockReturnThis() }
  const h = { response: vi.fn(() => response) }

  expect(mockAuthController.select.handler({}, h)).toBe(response)
  expect(mockAuthController.login.handler({}, h)).toBe(response)
  expect(h.response).toHaveBeenCalledTimes(2)
  expect(response.code).toHaveBeenNthCalledWith(1, 404)
  expect(response.code).toHaveBeenNthCalledWith(2, 404)
})
