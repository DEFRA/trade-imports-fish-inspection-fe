import {
  homeController,
  accountController,
  signOutController,
  mockAuthController
} from './controller.js'
import { config } from '#/config/config.js'

const mockAuthRoutes = config.get('isProduction')
  ? []
  : [
      {
        method: 'GET',
        path: '/mock-auth',
        ...mockAuthController.select
      },
      {
        method: 'POST',
        path: '/mock-auth',
        ...mockAuthController.login
      }
    ]

/**
 * Sets up the routes used in the home page.
 * These routes are registered in src/server/router.js.
 */
export const home = {
  plugin: {
    name: 'home',
    register(server) {
      server.route([
        ...mockAuthRoutes,
        {
          method: 'GET',
          path: '/',
          handler(request, h) {
            return h.redirect('/inspections')
          }
        },
        {
          method: 'GET',
          path: '/inspections',
          ...homeController
        },
        {
          method: 'GET',
          path: '/account',
          ...accountController
        },
        {
          method: 'POST',
          path: '/sign-out',
          ...signOutController
        }
      ])
    }
  }
}
