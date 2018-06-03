'use strict'

const { loadReporter } = require('./load')
const { validateReporter } = require('./validate')

// Add reporters' modules
const addReporters = function({ report }) {
  const reporters = getReporters({ report })
  return { ...report, reporters }
}

const getReporters = function({ report: { styles, options, output } }) {
  if (output === false) {
    return []
  }

  return styles.map(style => getReporter({ style, options }))
}

const getReporter = function({ style, options }) {
  const reporter = loadReporter({ style })

  validateReporter({ options, reporter, style })

  return reporter
}

module.exports = {
  addReporters,
}