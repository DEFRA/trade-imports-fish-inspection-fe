import { vi } from 'vitest'

import hapi from '@hapi/hapi'
import { statusCodes } from '../constants/status-codes.js'
import { config } from '#/config/config.js'
import * as createServerModule from '../../server.js'
import * as startServerModule from './start-server.js'

describe('#startServer', () => {
  let createServerSpy
  let hapiServerSpy
  let originalPort

  beforeAll(() => {
    originalPort = config.get('port')
    config.set('port', 0)
    createServerSpy = vi.spyOn(createServerModule, 'createServer')
    hapiServerSpy = vi.spyOn(hapi, 'server')
  })

  afterAll(() => {
    config.set('port', originalPort)
  })

  describe('When server starts', () => {
    let server

    afterAll(async () => {
      if (server) {
        await server.stop({ timeout: 0 })
      }
    })

    test('Should start up server as expected', async () => {
      server = await startServerModule.startServer()

      expect(createServerSpy).toHaveBeenCalled()
      expect(hapiServerSpy).toHaveBeenCalled()

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(result).toEqual({ message: 'success' })
      expect(statusCode).toBe(statusCodes.ok)
    })
  })

  describe('When server start fails', () => {
    test('Should log failed startup message', async () => {
      createServerSpy.mockRejectedValue(new Error('Server failed to start'))

      await expect(startServerModule.startServer()).rejects.toThrow(
        'Server failed to start'
      )
    })
  })
})
