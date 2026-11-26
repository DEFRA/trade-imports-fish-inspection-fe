import { buildInspectionDashboardViewModel } from '../inspection/services/inspection-dashboard-service.js'
import { findMockUser, mockUsers } from '../inspection/mock-users.js'
import { config } from '#/config/config.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'

const mockAuthPath = '/mock-auth'
export const mockAuthEnabled = config.get('authMode') === 'mock'

function forbidden(
  h,
  message = 'You do not have permission to access this page'
) {
  return h
    .view('error/index', {
      pageTitle: 'Forbidden',
      heading: statusCodes.forbidden,
      message
    })
    .code(statusCodes.forbidden)
}

function hasPhaAccess(user) {
  return user.roles?.includes('PHA') && user.portId
}

function requirePhaUser(handler) {
  return (request, h) => {
    if (!mockAuthEnabled) {
      return forbidden(h, 'Dashboard sign-in is not available on this service.')
    }

    const user = request.yar.get('mock-user')
    if (!user) {
      return h.redirect(mockAuthPath)
    }
    if (!hasPhaAccess(user)) {
      return forbidden(h)
    }
    return handler(request, h, user)
  }
}

export const homeController = {
  handler: requirePhaUser((request, h, user) => {
    return h.view('inspection/dashboard/index', {
      pageTitle: 'Dashboard',
      basePath: '',
      user,
      ...buildInspectionDashboardViewModel(user.portId, {
        query: request.query
      })
    })
  })
}

export const accountController = {
  handler: requirePhaUser((_request, h, user) => {
    return h.view('inspection/account', {
      pageTitle: 'Account information',
      user
    })
  })
}

export const signOutController = {
  handler(request, h) {
    request.yar.clear('mock-user')
    return h.redirect(mockAuthEnabled ? mockAuthPath : '/inspections')
  }
}

export const mockAuthController = {
  select: {
    handler(_request, h) {
      if (!mockAuthEnabled) {
        return h.response().code(statusCodes.notFound)
      }

      return h.view('inspection/mock-auth', {
        pageTitle: 'Test user sign-in',
        users: mockUsers
      })
    }
  },
  login: {
    handler(request, h) {
      if (!mockAuthEnabled) {
        return h.response().code(statusCodes.notFound)
      }

      request.yar.clear('mock-user')
      const user = findMockUser(request.payload?.mockUser)
      if (!user) {
        return h
          .response('Choose a valid mock user')
          .code(statusCodes.badRequest)
      }

      if (!hasPhaAccess(user)) {
        return forbidden(h)
      }

      request.yar.set('mock-user', user)
      return h.redirect('/inspections')
    }
  }
}
