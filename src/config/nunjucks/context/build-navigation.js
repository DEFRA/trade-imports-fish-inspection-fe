export function buildNavigation(request) {
  return [
    {
      text: 'Dashboard',
      href: '/',
      current: request?.path === '/'
    },
    {
      text: 'About',
      href: '/about',
      current: request?.path === '/about'
    }
  ]
}
