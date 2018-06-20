'use strict'

const { verifyTask } = require('../../plugins')

// Validate plugin-specific configuration
// Must be done after `helpers` plugin
const run = function(task, context, { plugins }) {
  plugins.forEach(plugin => verifyTask({ task, plugin }))
}

module.exports = {
  run,
}
