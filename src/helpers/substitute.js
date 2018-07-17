'use strict'

const { get } = require('lodash')

const { addErrorHandler } = require('../errors')
const { crawl, promiseThen } = require('../utils')

const { parseHelper, parseEscape } = require('./parse')
const { checkRecursion } = require('./recursion')
const { helperHandler } = require('./error')
const coreHelpers = require('./core')

// Crawl a value recursively to find helpers.
// When an helper is found, it is replaced by its evaluated value.
const substituteHelpers = function(info, value, path) {
  return crawl(value, evalNode, { path, ...info })
}

// Evaluate an object or part of an object for helpers
const evalNode = function(value, path, info) {
  const infoA = { ...info, path }

  const helper = parseHelper(value)
  // There is no helper
  if (helper === undefined) {
    return value
  }

  const unescapedValue = parseEscape({ helper })
  // There was something that looked like a helper but was an escaped value
  if (unescapedValue !== undefined) {
    return unescapedValue
  }

  // Check for infinite recursions
  const infoB = checkRecursion({ helper, info: infoA })

  const valueA = evalHelper({ helper, info: infoB })
  return valueA
}

const evalHelper = function({ helper, info }) {
  const { value, propPath } = getHelperValue({ helper, info })

  // Unkwnown helpers or helpers with `undefined` values return `undefined`,
  // instead of throwing an error. This allows users to use dynamic helpers, where
  // some properties might be defined or not.
  if (value === undefined) {
    return
  }

  const valueA = eSubstituteValue({ value, info, helper })

  return promiseThen(valueA, valueB => getHelperProp({ value: valueB, helper, info, propPath }))
}

// Retrieve helper's top-level value
const getHelperValue = function({
  helper: { name },
  info: {
    context: {
      config: { helpers },
    },
  },
}) {
  // User-defined helpers have loading priority over core helpers.
  // Like this, adding core helpers is non-breaking.
  // Also this allows overriding / monkey-patching core helpers (which can be
  // either good or bad).
  const helpersA = { ...coreHelpers, ...helpers }

  // `$$name` and `{ $$name: arg }` can both use dot notations
  // The top-level value is first evaluated (including recursively parsing its
  // helpers) then the rest of the property path is applied.
  const [topName, ...propPath] = name.split('.')

  const value = helpersA[topName]
  return { value, propPath }
}

// `$$name` can be a promise if it is an async `get` function, e.g. with `task.alias`
const substituteValue = function({ value, info }) {
  // An helper `$$name` can contain other helpers, which are then processed
  // recursively.
  // This can be used e.g. to create aliases.
  // This is done only on `$$name` but not `{ $$name: arg }` return value because:
  //  - in functions, it is most likely not the desired intention of the user
  //  - it would require complex escaping (if user does not desire recursion)
  //  - recursion can be achieved by using `context.helpers()`
  return promiseThen(value, valueA => substituteHelpers(info, valueA))
}

const eSubstituteValue = addErrorHandler(substituteValue, helperHandler)

// Retrive helper's non-top-level value (i.e. property path)
const getHelperProp = function({ value, helper, info, propPath }) {
  const valueC = getProp({ value, propPath })

  if (valueC === undefined) {
    return
  }

  return eEvalHelperFunction({ value: valueC, helper, info })
}

const getProp = function({ value, propPath }) {
  if (propPath.length === 0) {
    return value
  }

  return get(value, propPath)
}

// Fire helper when it's a function `{ $$name: arg }`
const evalHelperFunction = function({ value, helper: { type, arg }, info }) {
  if (type !== 'function') {
    return value
  }

  const args = getHelperArgs({ value, arg, info })

  return value(...args)
}

// Helper function arguments
const getHelperArgs = function({ value, arg, info }) {
  // Can use `{ $$helper: [...] }` to pass several arguments to the helper
  // E.g. `{ $$myFunc: [1, 2] }` will fire `$$myFunc(1, 2, context)`
  const args = Array.isArray(arg) ? arg : [arg]

  // Pass same `context` as `run` handlers
  // Only pass it when `helperFunction.context` is `true`
  // Reason: allowing re-using external/library functions without modifying their
  // signature or wrapping them
  if (!value.context) {
    return args
  }

  const context = getHelperContext({ info })
  // Pass as first argument. Reason: easier to parse arguments when arguments are
  // variadic or when there are optional arguments
  return [context, ...args]
}

// Context passed as argument to helper functions
const getHelperContext = function({ info, info: { context } }) {
  const recursiveSubstitute = substituteHelpers.bind(null, info)
  return { ...context, helpers: recursiveSubstitute }
}

const eEvalHelperFunction = addErrorHandler(evalHelperFunction, helperHandler)

module.exports = {
  substituteHelpers,
}