import { createServer } from '#/server/server.js'
import { homeController } from './controller.js'
import * as cheerio from 'cheerio'

// CDP Testing runs a production build without a service-specific auth override.
vi.hoisted(() => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('ENVIRONMENT', 'test')
  vi.stubEnv('AUTH_MODE', undefined)
  vi.stubEnv('SESSION_CACHE_ENGINE', 'memory')
  vi.stubEnv('LOG_ENABLED', 'false')
})

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
    vi.unstubAllEnvs()
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

  test('offers the two port users and importer on CDP Testing', async () => {
    const picker = await server.inject('/mock-auth')
    expect(picker.statusCode).toBe(200)
    const $ = cheerio.load(picker.payload)
    const choices = $('input[name="mockUser"]')
      .map((_, input) => $(input).val())
      .get()
    expect(choices.sort()).toEqual([
      'dover-test',
      'felixstowe-test',
      'non-pha-test'
    ])
  })

  test('denies dashboard access to non-pha-test', async () => {
    const mockUser = 'non-pha-test'
    const { response: signInResponse, cookie } = await signInAs(mockUser)
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

  test('denies a PHA session without an assigned port', () => {
    const code = vi.fn()

    homeController.handler(
      {
        yar: {
          get: () => ({ roles: ['PHA'] })
        }
      },
      { view: () => ({ code }) }
    )

    expect(code).toHaveBeenCalledWith(403)
  })

  test('selecting a non-PHA user removes previous PHA access', async () => {
    const { cookie, response: signedIn } = await signInAs('dover-test')
    const picker = await server.inject({
      url: '/mock-auth',
      headers: { cookie }
    })
    const $ = cheerio.load(picker.payload)
    const denied = await server.inject({
      method: 'POST',
      url: '/mock-auth',
      headers: { cookie },
      payload: {
        mockUser: 'non-pha-test',
        crumb: $('input[name="crumb"]').val()
      }
    })
    expect(denied.statusCode).toBe(403)
    const dashboard = await server.inject({
      url: '/inspections',
      headers: { cookie: cookiesFor(signedIn, denied) }
    })
    expect(dashboard.statusCode).toBe(302)
    expect(dashboard.headers.location).toBe('/mock-auth')
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
    expect($('.inspection-dashboard__reference')).toHaveLength(42)
    expect($('a.inspection-dashboard__reference')).toHaveLength(0)
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
    expect(sortForm.find('[data-inspection-sort-control]')).toHaveLength(2)
    expect(sortForm.find('input[name="search"]').attr('value')).toBe(
      'GB-IUU-2026-11002'
    )
    expect(sortForm.find('input[name="filter-status"]').attr('value')).toBe(
      'SUBMITTED'
    )
  })

  test('both filter panels search and clear on Active, but sort on their own tab', async () => {
    const response = await getDashboardAs(
      'felixstowe-test',
      '/inspections?tab=completed&quick-filter=completed-today'
    )
    const $ = cheerio.load(response.payload)
    for (const tab of ['active', 'completed']) {
      const form = $(
        `#${tab} form[aria-label="Search and filter consignments"]`
      )
      expect(form.attr('action')).toBe('/inspections#active-results')
      expect(form.find('[name="tab"]').val()).toBe('active')
      expect(form.find('[value="completed-today"]')).toHaveLength(0)
      expect(form.find('option[value="COMPLETED"]')).toHaveLength(0)
      expect(form.find('a:contains("Clear filters")').attr('href')).toBe(
        '/inspections?tab=active#active'
      )
      const sort = $(`#${tab} [data-inspection-sort-form]`)
      expect(sort.attr('action')).toBe(`/inspections#${tab}`)
      expect(sort.find('[name="quick-filter"]').val()).toBe('completed-today')
    }
  })

  test('keeps each results count focusable and immediately before its results table', async () => {
    const response = await getDashboardAs(
      'felixstowe-test',
      '/inspections?search=GB-IUU-2026-11002'
    )
    const $ = cheerio.load(response.payload)
    for (const [tab, expected] of [
      ['active', 'Showing 1 result'],
      ['completed', 'Showing 0 results']
    ]) {
      const count = $(`#${tab}-results`)
      expect(count.text().trim()).toBe(expected)
      expect(count.attr('tabindex')).toBe('-1')
      expect(count.parent().next().is('table')).toBe(true)
    }
  })

  test('the In progress card sets the editable form status without a second filter', async () => {
    const { cookie } = await signInAs('felixstowe-test')
    const loadDashboard = async (url) => {
      const response = await server.inject({ url, headers: { cookie } })
      expect(response.statusCode).toBe(200)
      return cheerio.load(response.payload)
    }
    const before = await loadDashboard(
      '/inspections?search=no-match&filter-origin=France'
    )
    const link = before(
      '.inspection-dashboard__summary-card:contains("In progress") [data-summary-link]'
    ).attr('href')
    const $ = await loadDashboard(link.split('#')[0])
    const form = $('#active form[aria-label="Search and filter consignments"]')

    expect(form.find('[name="filter-status"]').val()).toBe('IN_PROGRESS')
    expect(form.find('[name="search"]').val()).toBe('')
    expect(form.find('[name="filter-origin"]').val()).toBe('__all__')
    expect($('#active [name="quick-filter"]')).toHaveLength(0)
    expect($('#active .inspection-dashboard__filter-chip')).toHaveLength(1)
    expect($('#active .inspection-dashboard__filter-chip').text()).toContain(
      'Status: In progress'
    )
    expect(
      $(
        '.inspection-dashboard__summary-card:contains("In progress") [data-summary-link]'
      ).text()
    ).toContain('Remove filter')

    form.find('[name="filter-status"]').val('REQUIRES_DOCUMENT_CHECK')
    const after = await loadDashboard(`/inspections?${form.serialize()}`)
    const statuses = after('#active .inspection-dashboard__status')
      .map((_, el) => after(el).text().trim())
      .get()
    expect(new Set(statuses)).toEqual(new Set(['Requires document check']))
    expect(after('#active .inspection-dashboard__filter-chip')).toHaveLength(1)
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
    expect($('.inspection-dashboard__reference')).toHaveLength(42)
    expect($('a.inspection-dashboard__reference')).toHaveLength(0)
    expect($('.govuk-tabs__list').text()).toContain('Active (38)')
    expect($('.govuk-tabs__list').text()).toContain('Completed (4)')
    expect(
      $('.inspection-dashboard__summary-value')
        .map((_, value) => $(value).text())
        .get()
    ).toEqual(['17', '11', '0', '0'])
  })
})
