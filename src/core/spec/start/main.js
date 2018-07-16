'use strict'

const { loadOpenApiSpec } = require('./load')
const { normalizeSpec } = require('./normalize')

// Parse, validate and normalize an OpenAPI specification (including JSON references)
// then add it to `task.call|validate.*`
const start = async function(startData, { config: { spec } }) {
  if (spec === undefined) {
    return
  }

  const specA = await loadOpenApiSpec({ spec })

  const specB = normalizeSpec({ spec: specA })
  return { spec: specB }
}

module.exports = {
  start,
}