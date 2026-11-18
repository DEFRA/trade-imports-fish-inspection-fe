import { buildInspectionDashboardViewModel } from '../inspection/services/inspection-dashboard-service.js'

/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 */
export const homeController = {
  handler(request, h) {
    return h.view('inspection/dashboard/index', {
      pageTitle: 'Dashboard',
      basePath: '/part2/v4',
      ...buildInspectionDashboardViewModel(
        request.query,
        new Date(),
        {},
        '/part2/v4'
      )
    })
  }
}
