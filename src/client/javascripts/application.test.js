import { vi } from 'vitest'

vi.mock('govuk-frontend', () => ({
  createAll: vi.fn(),
  Button: 'Button',
  Checkboxes: 'Checkboxes',
  ErrorSummary: 'ErrorSummary',
  Radios: 'Radios',
  SkipLink: 'SkipLink',
  Tabs: 'Tabs'
}))

vi.mock('./cookies.js', () => ({
  default: {
    init: vi.fn()
  }
}))

const scrollPositionKey = 'inspection-sort-scroll-position'

const initializeApplication = async (savedPosition, controls = []) => {
  const storedValues = new Map()
  if (savedPosition !== null) {
    storedValues.set(scrollPositionKey, savedPosition)
  }

  const sessionStorage = {
    getItem: vi.fn((key) => storedValues.get(key) ?? null),
    removeItem: vi.fn((key) => storedValues.delete(key)),
    setItem: vi.fn((key, value) => storedValues.set(key, value))
  }
  const requestAnimationFrame = vi.fn()
  const scrollTo = vi.fn()

  vi.stubGlobal('sessionStorage', sessionStorage)
  vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
  vi.stubGlobal('window', { scrollTo, scrollY: 480 })
  vi.stubGlobal('document', {
    querySelectorAll: vi.fn(() => controls)
  })

  vi.resetModules()
  await import('./application.js')

  const govukFrontend = await import('govuk-frontend')
  const cookies = await import('./cookies.js')

  return {
    cookies,
    govukFrontend,
    requestAnimationFrame,
    scrollTo,
    sessionStorage
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('application browser initialization', () => {
  test('restores sort scroll position and submits a changed sort control', async () => {
    const control = {
      addEventListener: vi.fn((event, listener) => {
        control.changeListener = listener
      }),
      form: {
        requestSubmit: vi.fn()
      }
    }

    const {
      cookies,
      govukFrontend,
      requestAnimationFrame,
      scrollTo,
      sessionStorage
    } = await initializeApplication('320', [control])

    expect(cookies.default.init).toHaveBeenCalledOnce()
    expect(sessionStorage.removeItem).toHaveBeenCalledWith(scrollPositionKey)
    expect(requestAnimationFrame).toHaveBeenCalledOnce()
    requestAnimationFrame.mock.calls[0][0]()
    expect(scrollTo).toHaveBeenCalledWith(0, 320)

    control.changeListener()
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      scrollPositionKey,
      '480'
    )
    expect(control.form.requestSubmit).toHaveBeenCalledOnce()
    expect(
      govukFrontend.createAll.mock.calls.map(([component]) => component)
    ).toEqual([
      'Button',
      'Checkboxes',
      'ErrorSummary',
      'Radios',
      'SkipLink',
      'Tabs'
    ])
  })

  test('does not restore scrolling when there is no saved sort position', async () => {
    const { requestAnimationFrame, sessionStorage } =
      await initializeApplication(null)

    expect(sessionStorage.removeItem).not.toHaveBeenCalled()
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })
})
