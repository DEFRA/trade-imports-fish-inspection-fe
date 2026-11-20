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

const INSPECTION_SORT_SCROLL_POSITION_KEY = 'inspection-sort-scroll-position'
const sortScrollPosition = sessionStorage.getItem(
  INSPECTION_SORT_SCROLL_POSITION_KEY
)
if (sortScrollPosition !== null) {
  sessionStorage.removeItem(INSPECTION_SORT_SCROLL_POSITION_KEY)
  globalThis.requestAnimationFrame(() =>
    window.scrollTo(0, Number(sortScrollPosition))
  )
}

document
  .querySelectorAll('[data-inspection-sort-control]')
  .forEach((control) => {
    control.addEventListener('change', () => {
      sessionStorage.setItem(
        INSPECTION_SORT_SCROLL_POSITION_KEY,
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
