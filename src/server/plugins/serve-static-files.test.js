import { startServer } from '#/server/common/helpers/start-server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { config } from '#/config/config.js'

describe('#serveStaticFiles', () => {
  let server

  describe('When secure context is disabled', () => {
    let originalPort

    beforeEach(async () => {
      originalPort = config.get('port')
      config.set('port', 0)
      server = await startServer()
    })

    afterEach(async () => {
      if (server) {
        await server.stop({ timeout: 0 })
        server = undefined
      }
      config.set('port', originalPort)
    })

    test('Should serve favicon as expected', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/favicon.ico'
      })

      expect(statusCode).toBe(statusCodes.noContent)
    })
  })
})
