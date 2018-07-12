'use strict'

const { TestOpenApiError } = require('../../../errors')
const { validateFromSchema, removePrefixes } = require('../../../validation')

const { checkRequired } = require('./required')

// Validates response headers against OpenAPI specification
const validateHeaders = function({ validate, response }) {
  const validateHeaders = removePrefixes(validate, 'headers')
  const headers = removePrefixes(response, 'headers')

  Object.entries(validateHeaders).forEach(([name, schema]) =>
    validateHeader({ name, schema, headers }),
  )
}

const validateHeader = function({ name, schema, headers }) {
  const header = getResponseHeader({ headers, name })

  checkRequired({ schema, value: header, property: PROPERTY(name), name: NAME(name) })

  if (header === undefined) {
    return
  }

  validateHeaderValue({ name, schema, header })
}

const getResponseHeader = function({ headers, name }) {
  const nameB = Object.keys(headers).find(nameA => nameA.toLowerCase() === name)

  if (nameB === undefined) {
    return
  }

  return headers[nameB]
}

// Validates response header against JSON schema from specification
const validateHeaderValue = function({ name, schema, header }) {
  const { error, schema: schemaA, value, property } = validateFromSchema({
    schema,
    value: header,
    propName: PROPERTY(name),
  })
  if (error === undefined) {
    return
  }

  throw new TestOpenApiError(`${NAME(name)} ${error}`, { schema: schemaA, value, property })
}

const PROPERTY = name => `validate.headers.${name}`
const NAME = name => `Response header '${name}'`

module.exports = {
  validateHeaders,
}
