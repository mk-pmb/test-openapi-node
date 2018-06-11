'use strict'

const { omit } = require('lodash')

const { locationToKey } = require('../../../../../utils')
const { normalizeSchema } = require('../json_schema')

const IN_TO_LOCATION = require('./in_to_location')
const { addSeparator } = require('./separator')

// From OpenAPI request `parameters` to normalized format
const normalizeParams = function({ params }) {
  const paramsA = params.map(normalizeParam)
  const paramsB = Object.assign({}, ...paramsA)
  return paramsB
}

const normalizeParam = function({
  name,
  in: paramIn,
  required = false,
  collectionFormat,
  ...schema
}) {
  const location = IN_TO_LOCATION[paramIn]
  const key = locationToKey({ name, location })

  const schemaA = getSchema({ schema })

  const schemaB = { ...schemaA, 'x-required': required }

  const schemaC = addSeparator({ schema: schemaB, collectionFormat })

  return { [key]: schemaC }
}

// Normalize OpenAPI `in` to the same keys as `task.params.*`
const getSchema = function({ schema }) {
  // `allowEmptyValue` is deprecated and is ambiguous
  // (https://github.com/OAI/OpenAPI-Specification/issues/1573)
  // so we skip it
  const schemaA = omit(schema, 'allowEmptyValue')
  // OpenAPI schema can be either a `schema` property, or is directly merged in
  const schemaB = schemaA.schema || schemaA
  const schemaC = normalizeSchema({ schema: schemaB })
  return schemaC
}

module.exports = {
  normalizeParams,
}
