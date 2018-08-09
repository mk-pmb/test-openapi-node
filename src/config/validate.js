'use strict'

const { TestOpenApiError } = require('../errors')
const { getPath } = require('../utils')
const { checkSchema } = require('../validation')
const { restrictInput } = require('../tasks')

const CONFIG_SCHEMA = require('./schema')

// Validate configuration
const validateConfig = function({ config }) {
  checkSchema({
    schema: CONFIG_SCHEMA,
    value: config,
    name: 'config',
    message: 'Configuration',
  })

  // Make sure input configuration is valid JSON
  restrictInput(config, throwRestrictError)
}

const throwRestrictError = function({ message, value, path }) {
  const property = getPath(['config', ...path])
  throw new TestOpenApiError(`Configuration ${message}`, { value, property })
}

module.exports = {
  validateConfig,
}
