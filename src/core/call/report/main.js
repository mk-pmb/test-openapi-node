'use strict'

const { titleize } = require('underscore.string')

const { removePrefixes, sortArray } = require('../../../utils')
const { yellow, highlightValueAuto, prettifyJson, truncate } = require('../../report/utils')

const { getTitle } = require('./title')

const report = function({ rawRequest, rawResponse } = {}) {
  // We haven't reached `serialize` stage yet
  if (rawRequest === undefined) {
    return {}
  }

  const title = getTitle({ rawRequest, rawResponse })
  const request = getRequest({ rawRequest })
  const response = getResponse({ rawResponse })

  return { title, rawRequest: undefined, rawResponse: undefined, request, response }
}

// Print HTTP request in error messages
const getRequest = function({ rawRequest, rawRequest: { method, url, body, path } }) {
  const urlA = printUrl({ method, url, path })
  const headersA = printHeaders(rawRequest)
  const bodyA = printBody({ body })

  return `${urlA}${headersA}${bodyA}\n`
}

// Print HTTP response in error messages
const getResponse = function({ rawResponse, rawResponse: { status, body } = {} }) {
  // We haven't reached `request` stage yet
  if (rawResponse === undefined) {
    return
  }

  const statusA = printStatus({ status })
  const headersA = printHeaders(rawResponse)
  const bodyA = printBody({ body })

  return `${statusA}\n\n${headersA}${bodyA}\n`
}

const printUrl = function({ method, path, url = path }) {
  const methodA = printMethod({ method })
  return `${methodA} ${url}\n\n`
}

const printMethod = function({ method }) {
  return yellow(method.toUpperCase())
}

const printStatus = function({ status }) {
  return `${yellow('Status:')} ${status}`
}

const printHeaders = function(object) {
  const headers = removePrefixes(object, 'headers')
  const headersA = Object.entries(headers).map(printHeader)
  const headersB = sortArray(headersA)
  const headersC = headersB.join('\n')
  return headersC
}

const printHeader = function([name, value]) {
  // Both `request.headers.*` and `response.headers.*` are normalized to lowercase
  const nameA = titleize(name)
  return `${yellow(`${nameA}:`)} ${value}`
}

const printBody = function({ body }) {
  if (body === undefined || body.trim() === '') {
    return ''
  }

  const bodyA = prettifyJson(body)
  const bodyB = truncate(bodyA)
  const bodyC = highlightValueAuto(bodyB)
  return `\n\n${bodyC}`
}

module.exports = {
  report,
}
