'use strict'

const { merge } = require('lodash')

const { mergeParams, mergeHeaders } = require('../../../utils')

const { getSpecOperation, getSpecResponse } = require('./operation')
const { mergeInvalidValue, isInvalidValue } = require('./invalid')

// Merge `task.parameters.*` to specification
const mergeSpecParams = function({ taskKey, params, config }) {
  const specOperation = getSpecOperation({ taskKey, config })
  if (specOperation === undefined) {
    return
  }

  const paramsA = mergeParams([...specOperation.params, ...params], mergeSpec)
  return { params: paramsA }
}

// Merge `task.validate.*` to specification
const mergeSpecValidate = function({
  taskKey,
  validate: { status, headers, body },
  rawResponse,
  config,
}) {
  const specResponse = getSpecResponse({ taskKey, config, rawResponse })
  if (specResponse === undefined) {
    return
  }

  const headersA = mergeHeaders([...specResponse.headers, ...headers], mergeSpec)
  const bodyA = mergeSpecValue(specResponse.body, body)

  return { validate: { status, headers: headersA, body: bodyA } }
}

// Merge a `task.*.*` value with the specification value
const mergeSpec = function({ value: specValue, ...specRest }, { value, ...rest }) {
  const valueA = mergeSpecValue(specValue, value)
  return { ...specRest, ...rest, value: valueA }
}

// Deep merge the JSON schemas
// Both `specValue` and `value` might be `undefined`
const mergeSpecValue = function(specValue, value) {
  if (isInvalidValue({ value })) {
    return mergeInvalidValue({ specValue })
  }

  return merge({}, specValue, value)
}

module.exports = {
  mergeSpecParams,
  mergeSpecValidate,
}