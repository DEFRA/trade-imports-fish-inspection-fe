import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        current: false,
        text: 'Dashboard',
        href: '/'
      },
      {
        current: false,
        text: 'About',
        href: '/about'
      }
    ])
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        current: true,
        text: 'Dashboard',
        href: '/'
      },
      {
        current: false,
        text: 'About',
        href: '/about'
      }
    ])
  })
})
