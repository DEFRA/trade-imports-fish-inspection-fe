import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Radios,
  SkipLink,
  Tabs
} from 'govuk-frontend'
import cookies from './cookies.js'

cookies.init()

const sortScrollPosition = sessionStorage.getItem(
  'inspection-sort-scroll-position'
)
if (sortScrollPosition !== null) {
  sessionStorage.removeItem('inspection-sort-scroll-position')
  globalThis.requestAnimationFrame(() =>
    window.scrollTo(0, Number(sortScrollPosition))
  )
}

document
  .querySelectorAll('[data-inspection-sort-control]')
  .forEach((control) => {
    control.addEventListener('change', () => {
      sessionStorage.setItem(
        'inspection-sort-scroll-position',
        String(window.scrollY)
      )
      control.form.requestSubmit()
    })
  })

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Radios)
createAll(SkipLink)
createAll(Tabs)
