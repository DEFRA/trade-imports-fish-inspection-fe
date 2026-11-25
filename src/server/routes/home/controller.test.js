import { createServer } from '#/server/server.js'
import { homeController } from './controller.js'
import * as cheerio from 'cheerio'

describe('#homeController', () => {
  let server

  const cookiesFor = (...responses) => {
    const cookies = new Map()
    for (const response of responses) {
      const setCookies = response.headers['set-cookie'] || []
      for (const setCookie of [].concat(setCookies)) {
        const cookie = setCookie.split(';')[0]
        const separator = cookie.indexOf('=')
        cookies.set(cookie.slice(0, separator), cookie.slice(separator + 1))
      }
    }

    return [...cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  const signInAs = async (mockUser) => {
    const signInPage = await server.inject({
      method: 'GET',
      url: '/mock-auth'
    })
    const $ = cheerio.load(signInPage.payload)
    const signInResponse = await server.inject({
      method: 'POST',
      url: '/mock-auth',
      headers: { cookie: cookiesFor(signInPage) },
      payload: {
        mockUser,
        crumb: $('input[name="crumb"]').val()
      }
    })

    return {
      response: signInResponse,
      cookie: cookiesFor(signInPage, signInResponse)
    }
  }

  const getDashboardAs = async (mockUser, url = '/inspections') => {
    const { cookie } = await signInAs(mockUser)
    return server.inject({
      method: 'GET',
      url,
      headers: { cookie }
    })
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('redirects the root route to the dashboard route', async () => {
    const response = await server.inject({ method: 'GET', url: '/' })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/inspections')
  })

  test('redirects to sign-in when there is no signed-in user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/inspections'
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/mock-auth')
  })

  test('does not register the previous versioned dashboard route', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/part2/v4/inspections'
    })

    expect(response.statusCode).toBe(404)
  })

  test('does not select a mock identity from a query parameter', async () => {
    const signInPage = await server.inject({
      method: 'GET',
      url: '/mock-auth?mockUser=felixstowe'
    })
    const response = await server.inject({
      method: 'GET',
      url: '/inspections',
      headers: { cookie: cookiesFor(signInPage) }
    })

    expect(signInPage.statusCode).toBe(200)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/mock-auth')
  })

  test('shows a 403 Forbidden page when a non-PHA user signs in', async () => {
    const { response: signInResponse, cookie } = await signInAs('non-pha-test')
    const response = await server.inject({
      method: 'GET',
      url: '/inspections',
      headers: { cookie }
    })
    const $ = cheerio.load(signInResponse.payload)

    expect(signInResponse.statusCode).toBe(403)
    expect($('h1').text()).toContain('403')
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/mock-auth')
  })

  test('shows account information for the signed-in user', async () => {
    const { cookie } = await signInAs('felixstowe-test')
    const response = await server.inject({
      method: 'GET',
      url: '/account',
      headers: { cookie }
    })
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(200)
    expect($('h1').text()).toContain('Account information')
    expect($('.govuk-summary-list').text()).toContain('John Smith')
    expect($('.govuk-summary-list').text()).toContain('PHA-FELIXSTOWE')
    expect($('.govuk-summary-list').text()).toContain('FELIXSTOWE')
  })

  test('redirects anonymous account requests to sign-in', async () => {
    const response = await server.inject({ method: 'GET', url: '/account' })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/mock-auth')
  })

  test('redirects a PHA user without a port to sign-in', () => {
    const redirect = vi.fn()

    homeController.handler(
      {
        yar: {
          get: () => ({ roles: ['PHA'] })
        }
      },
      { redirect }
    )

    expect(redirect).toHaveBeenCalledWith('/mock-auth')
  })

  test('rejects an unknown mock user during sign-in', async () => {
    const signInPage = await server.inject({
      method: 'GET',
      url: '/mock-auth'
    })
    const $ = cheerio.load(signInPage.payload)
    const response = await server.inject({
      method: 'POST',
      url: '/mock-auth',
      headers: { cookie: cookiesFor(signInPage) },
      payload: {
        mockUser: 'unknown-user',
        crumb: $('input[name="crumb"]').val()
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.payload).toContain('Choose a valid mock user')
  })

  test('signs out and clears the session', async () => {
    const { response: signInResponse, cookie } =
      await signInAs('felixstowe-test')
    const accountPage = await server.inject({
      method: 'GET',
      url: '/account',
      headers: { cookie }
    })
    const $ = cheerio.load(accountPage.payload)
    const signOutResponse = await server.inject({
      method: 'POST',
      url: '/sign-out',
      headers: { cookie },
      payload: { crumb: $('input[name="crumb"]').val() }
    })
    const afterSignOut = await server.inject({
      method: 'GET',
      url: '/account',
      headers: { cookie: cookiesFor(signInResponse, signOutResponse) }
    })

    expect($('form[action="/sign-out"] button').text()).toContain('Sign out')
    expect(signOutResponse.statusCode).toBe(302)
    expect(signOutResponse.headers.location).toBe('/mock-auth')
    expect(afterSignOut.statusCode).toBe(302)
    expect(afterSignOut.headers.location).toBe('/mock-auth')
  })

  test('shows only submitted notifications for the signed-in PHA port', async () => {
    const response = await getDashboardAs('felixstowe-test')
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(200)
    expect($('.govuk-inset-text [onclick]')).toHaveLength(0)
    expect($('.govuk-inset-text').text()).toContain('Inspection guidance')
    expect(response.payload).toContain(
      'Signed in as John Smith, Port of Felixstowe Port Health Authority'
    )
    expect(response.payload).toContain('GB-IUU-2026-11002')
    expect(response.payload).not.toContain('GB-IUU-2026-21001')
    expect(response.payload).not.toContain('GB-IUU-2026-21003')
    expect($('#active .inspection-dashboard__reference')).toHaveLength(10)
    expect($('nav a[href="/about"]')).toHaveLength(0)
    expect($('nav a[href="/"]')).toHaveLength(0)
  })

  test('sort controls have a separate form with the applied filters', async () => {
    const response = await getDashboardAs(
      'felixstowe-test',
      '/inspections?tab=active&search=GB-IUU-2026-11002&filter-status=SUBMITTED'
    )
    const $ = cheerio.load(response.payload)
    const sortForm = $('[data-inspection-sort-form]').first()

    expect(response.statusCode).toBe(200)
    expect(sortForm.find('select[name="sort-by"]')).toHaveLength(1)
    expect(sortForm.find('select[name="sort-order"]')).toHaveLength(1)
    expect(sortForm.find('button[type="submit"]').text()).toContain(
      'Apply sort'
    )
    expect(sortForm.find('input[name="search"]').attr('value')).toBe(
      'GB-IUU-2026-11002'
    )
    expect(sortForm.find('input[name="filter-status"]').attr('value')).toBe(
      'SUBMITTED'
    )
  })

  test('shows more notifications without losing search, filter, or sort state', async () => {
    const query =
      '?tab=active&search=GB-IUU-2026-110&sort-by=reference&sort-order=desc'
    const firstPage = await getDashboardAs(
      'felixstowe-test',
      `/inspections${query}`
    )
    const $firstPage = cheerio.load(firstPage.payload)
    const showMoreHref = $firstPage('a.govuk-button--secondary').attr('href')

    expect($firstPage('#active .inspection-dashboard__reference')).toHaveLength(
      10
    )
    expect(showMoreHref).toContain('search=GB-IUU-2026-110')
    expect(showMoreHref).toContain('sort-by=reference')
    expect(showMoreHref).toContain('sort-order=desc')
    expect(showMoreHref).toContain('page=2#active-next-batch')

    const secondPage = await getDashboardAs('felixstowe-test', showMoreHref)
    const $secondPage = cheerio.load(secondPage.payload)

    expect(
      $secondPage('#active .inspection-dashboard__reference')
    ).toHaveLength(20)
    expect($secondPage('#active-next-batch')).toHaveLength(1)
    expect($secondPage('a.govuk-button--secondary').text()).toContain(
      'Show more'
    )
    const nextPageHref = $secondPage('a.govuk-button--secondary').attr('href')
    expect(nextPageHref).toContain('search=GB-IUU-2026-110')
    expect(nextPageHref).toContain('page=3#active-next-batch')
  })

  test('opens a scoped consignment overview from its reference', async () => {
    const response = await getDashboardAs(
      'felixstowe-test',
      '/inspection/GB-IUU-2026-11002'
    )
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(200)
    expect($('h1').text()).toContain('Consignment GB-IUU-2026-11002')
    expect(response.payload).toContain('New England Seafood International Ltd')
    expect(response.payload).toContain('Skipjack tuna')
    expect(
      $('.inspection-overview__summary-card').eq(3).text().replace(/\s+/g, ' ')
    ).toContain('PENDRUC - IMO 9741102')
    expect($('.inspection-overview__summary-card').eq(3).text()).toContain(
      'Container:'
    )
    expect($('.inspection-overview__summary-card').eq(3).text()).toContain(
      'MSCU2205101'
    )
    expect($('.inspection-overview__summary-card').eq(0).text()).toContain(
      'Felixstowe'
    )
    expect($('.inspection-overview__summary-card').eq(1).text()).toContain(
      'EORI: GB123456789012'
    )
    expect(response.payload).toContain('Catch certificates')
    expect($('.inspection-overview__summary-card')).toHaveLength(5)
    expect($('#recent-change-heading').text()).toContain('Recent changes')
    expect($('.inspection-overview__recent-change-timeline')).toHaveLength(1)
    expect($('.inspection-overview__recent-change-timeline').text()).toContain(
      'Port Health Authority'
    )
    expect($('.inspection-overview__recent-change-timeline').text()).toContain(
      'Inspector status changed to Requires document check'
    )
    expect($('#evidence-heading').text()).toContain('Evidence')
    expect($('#weight-heading').text()).toContain('Commodity weight comparison')
    expect($('.inspection-overview__comparison-table')).toHaveLength(1)
    expect(
      $('form[action="/inspection/GB-IUU-2026-11002/action"]')
    ).toHaveLength(1)
    expect(
      $(
        'form[action="/inspection/GB-IUU-2026-11002/action"] input[type="checkbox"]'
      )
    ).toHaveLength(1)
    expect(
      $(
        'form[action="/inspection/GB-IUU-2026-11002/action"] label[for="decision-confirmation"]'
      ).text()
    ).toContain(
      'I confirm this records the outcome of my IUU control check and that the decision will be shared with the importer.'
    )
    expect(
      $(
        'form[action="/inspection/GB-IUU-2026-11002/action"] input[type="file"]'
      )
    ).toHaveLength(0)
  })

  test('shows a back link to inspections on the consignment overview', async () => {
    const response = await getDashboardAs(
      'felixstowe-test',
      '/inspection/GB-IUU-2026-11002'
    )
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(200)
    expect($('a.govuk-back-link').text()).toContain('Back')
    expect($('a.govuk-back-link').attr('href')).toBe('/inspections')
  })

  test('shows a generated vessel for consignment GB-IUU-2026-11006', async () => {
    const response = await getDashboardAs(
      'felixstowe-test',
      '/inspection/GB-IUU-2026-11006'
    )
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(200)
    expect($('.inspection-overview__summary-card').eq(3).text()).toMatch(
      /Vessel\s+\S+.*IMO\s+\d{7}/
    )
  })

  test('does not expose a consignment outside the signed-in PHA port', async () => {
    const response = await getDashboardAs(
      'felixstowe-test',
      '/inspection/GB-IUU-2026-21001'
    )

    expect(response.statusCode).toBe(404)
  })

  test('shows the GDS 404 page for the unimplemented completed inspections route', async () => {
    const response = await getDashboardAs(
      'felixstowe-test',
      '/inspections/completed'
    )
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(404)
    expect($('h1').text()).toContain('404')
    expect(response.payload).toContain('Page not found')
  })

  test('shows only submitted notifications and scoped counts for another PHA', async () => {
    const response = await getDashboardAs('dover-test')
    const $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(200)
    expect(response.payload).toContain(
      'Signed in as Jane Doe, Port of Dover Port Health Authority'
    )
    expect(response.payload).toContain('GB-IUU-2026-21001')
    expect(response.payload).toContain('GB-IUU-2026-21002')
    expect(response.payload).not.toContain('GB-IUU-2026-11002')
    expect(response.payload).not.toContain('GB-IUU-2026-21003')
    expect($('#active .inspection-dashboard__reference')).toHaveLength(10)
    expect($('.govuk-tabs__list').text()).toContain('Active (38)')
    expect($('.govuk-tabs__list').text()).toContain('Completed (4)')
    expect(
      $('.inspection-dashboard__summary-value')
        .map((_, value) => $(value).text())
        .get()
    ).toEqual(['17', '11', '0', '0'])
  })
})
