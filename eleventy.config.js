import { govukEleventyPlugin } from '@x-govuk/govuk-eleventy-plugin'

const pathPrefix = process.env.GITHUB_ACTIONS
  ? '/trade-imports-fish-inspection-fe/'
  : '/'

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    'docs/assets/images/favicon.svg': 'favicon.svg',
    'docs/assets/images/defra-logo-white.png':
      'assets/images/defra-logo-white.png'
  })

  // Register the plugin
  eleventyConfig.addPlugin(govukEleventyPlugin, {
    stylesheets: ['/assets/styles/defra.css'],
    titleSuffix: 'Defra FIS Tech Docs',
    icons: {
      shortcut: '/favicon.svg'
    },
    header: {
      logotype: {
        html: `<img class="app-header__logo-image" src="${pathPrefix}assets/images/defra-logo-white.png" alt="">`
      },
      productName: 'FIS Tech Docs - Inspection Frontend',
      search: {
        indexPath: '/search-index.json',
        sitemapPath: '/sitemap'
      }
    },
    templates: {
      searchIndex: true
    },
    footer: {
      logo: false,
      contentLicence: false,
      copyright: { text: '© Defra' }
    }
  })

  return {
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dir: {
      // The folder where all your content will live:
      input: 'docs',
      output: '_site'
    },

    pathPrefix
  }
}
