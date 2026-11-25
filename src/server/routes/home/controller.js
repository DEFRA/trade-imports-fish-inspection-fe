import Boom from '@hapi/boom'
import { buildInspectionDashboardViewModel } from '../inspection/services/inspection-dashboard-service.js'
import { buildInspectionConsignmentViewModel } from '../inspection/services/inspection-consignment-service.js'
import { findMockUser, mockUsers } from '../inspection/mock-users.js'
import { config } from '#/config/config.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'

const mockAuthPath = '/mock-auth'
const mockAuthEnabled = !config.get('isProduction')

/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 */
export const homeController = {
  handler(request, h) {
    const user = request.yar.get('mock-user')
    if (!user) {
      return h.redirect(mockAuthPath)
    }

    if (!user.roles?.includes('PHA') || !user.portId) {
      return h.redirect(mockAuthPath)
    }

    return h.view('inspection/dashboard/index', {
      pageTitle: 'Dashboard',
      basePath: '',
      user,
      ...buildInspectionDashboardViewModel(user.portId, {
        query: request.query
      })
    })
  }
}

export const consignmentController = {
  handler(request, h) {
    const user = request.yar.get('mock-user')
    if (!user?.roles?.includes('PHA') || !user.portId) {
      return h.redirect(mockAuthPath)
    }

    const consignment = buildInspectionConsignmentViewModel(
      user.portId,
      request.params.reference
    )
    if (!consignment) {
      throw Boom.notFound()
    }

    return h.view('inspection/consignment', {
      pageTitle: `Consignment ${consignment.reference}`,
      basePath: '',
      user,
      consignment
    })
  }
}

export const accountController = {
  handler(request, h) {
    const user = request.yar.get('mock-user')
    if (!user) {
      return h.redirect(mockAuthPath)
    }

    return h.view('inspection/account', {
      pageTitle: 'Account information',
      user
    })
  }
}

export const signOutController = {
  handler(request, h) {
    request.yar.clear('mock-user')
    return h.redirect(mockAuthPath)
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

      const user = findMockUser(request.payload?.mockUser)
      if (!user) {
        return h
          .response('Choose a valid mock user')
          .code(statusCodes.badRequest)
      }

      if (!user.roles?.includes('PHA')) {
        return h
          .view('error/index', {
            pageTitle: 'Forbidden',
            heading: statusCodes.forbidden,
            message: 'You do not have permission to access this page'
          })
          .code(statusCodes.forbidden)
      }

      request.yar.set('mock-user', user)
      return h.redirect('/inspections')
    }
  }
}
