'use strict'

const { addErrorHandler, topLevelHandler } = require('../errors')
const { loadConfig } = require('../config')
const { getTasks } = require('../tasks')
const { getPlugins } = require('../plugins')

const { runTasks } = require('./tasks')

// Main entry point
const run = async function(config = {}) {
  const configA = loadConfig({ config })

  const configB = await getTasks({ config: configA })

  const { config: configC, plugins } = getPlugins({ config: configB })

  const tasks = await runTasks({ config: configC, plugins })
  return tasks
}

const eRun = addErrorHandler(run, topLevelHandler)

// The following plugins can be run (order in parenthesis).
// `start`, i.e. before any tasks:
//   - `glob` (1000): merge tasks whose name include globbing matching other task names.
//   - `call` (1100): normalize `task.call.*` object to an array
//   - `random` (1200): normalize and validate `task.random.*` JSON schemas
//   - `validate` (1300): normalize `task.validate.*`
//   - `spec` (1400): parse, validate and normalize an OpenAPI specification
//   - `dry` (1500): `config.dry: true` makes everything stop just before the
//     first task run
//   - `repeat` (1600): repeat each task `config.repeat` times
// `task`, i.e. for each task:
//   - `deps` (1000): replace all `deps`, i.e. references to other tasks
//   - `spec` (1100): merge OpenAPI specification to `task.call.*`
//   - `random` (1200): generates random values based on `task.random.*`
//     JSON schemas
//   - `format` (1300): stringify request parameters
//   - `url` (1400): build request URL from request parameters
//   - `call` (1500): fire actual HTTP call
//   - `format` (1600): parse response
//   - `spec` (1700): merge OpenAPI specification to `task.validate.*`
//   - `validate` (1800): validate response against `task.validate.*` JSON schemas

module.exports = {
  run: eRun,
}
