import { govukEleventyPlugin } from '@x-govuk/govuk-eleventy-plugin'

export default function (eleventyConfig) {
  // Register the plugin
  eleventyConfig.addPlugin(govukEleventyPlugin, {
    // Use docs/assets/application.scss instead of the plugin's default stylesheet
    stylesheets: ['/assets/application.css']
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

    pathPrefix: process.env.GITHUB_ACTIONS
      ? '/trade-imports-fish-inspection-fe/'
      : '/'
  }
}
