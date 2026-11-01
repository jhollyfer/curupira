import { Writable } from 'node:stream'

import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { LimiterResponse } from '@adonisjs/limiter'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import { LoggerManager } from '@adonisjs/core/logger'

import loggerConfig from '#config/logger'
import HttpExceptionHandler from '#exceptions/handler'
import HTTPException from '#exceptions/http.exception'

async function run(error: unknown) {
  const handler = await app.container.make(HttpExceptionHandler)
  const context = new HttpContextFactory().create()

  await handler.handle(error, context)

  return { status: context.response.getStatus(), body: context.response.getBody() }
}

class Sink extends Writable {
  readonly lines: string[] = []

  override _write(chunk: Buffer, _encoding: string, done: () => void): void {
    this.lines.push(chunk.toString('utf-8'))
    done()
  }
}

async function logOfThrottledRoute(pattern: string, ip: string): Promise<string> {
  const sink = new Sink()
  const config = { ...loggerConfig.loggers.app, transport: undefined, destination: sink }
  const logger = new LoggerManager({ default: 'app', loggers: { app: config } }).use('app')
  const handler = await app.container.make(HttpExceptionHandler)
  const context = new HttpContextFactory().merge({ logger }).create()
  // The factory takes a bare route that the context does not expose; the handler reads the
  // matched route's pattern, so the test plants just that.
  Object.defineProperty(context, 'route', { value: { pattern } })
  // The factory request has no socket to read an address from.
  Object.defineProperty(context.request, 'ip', { value: () => ip })
  const response = new LimiterResponse({ limit: 5, remaining: 0, consumed: 5, availableIn: 600 })

  await handler.handle(new limiterErrors.E_TOO_MANY_REQUESTS(response), context)

  return sink.lines.join('')
}

test.group('exceptions > handler (unit)', () => {
  test('the 429 of an anonymous route does not log the caller IP', async ({ assert }) => {
    const output = await logOfThrottledRoute('/storefront/reports', '203.0.113.9')

    assert.include(output, 'rate_limited')
    assert.include(output, '/storefront/reports')
    assert.notInclude(output, '203.0.113.9')
  })

  test('the 429 of the panel door keeps the IP in the security log', async ({ assert }) => {
    const output = await logOfThrottledRoute('/sessions/sign-in', '203.0.113.9')

    assert.include(output, '203.0.113.9')
  })

  test("the guard's 401 uses the HTTPException factory code", async ({ assert }) => {
    const result = await run(new authErrors.E_UNAUTHORIZED_ACCESS('x', { guardDriverName: 'api' }))

    assert.equal(result.status, 401)
    assert.deepInclude(result.body, { status: 401, code: 'AUTHENTICATION_REQUIRED' })
  })

  test("the limiter's 429 becomes the envelope with a stable code", async ({ assert }) => {
    const response = new LimiterResponse({ limit: 5, remaining: 0, consumed: 5, availableIn: 600 })
    const result = await run(new limiterErrors.E_TOO_MANY_REQUESTS(response))

    assert.equal(result.status, 429)
    assert.deepInclude(result.body, { status: 429, code: 'TOO_MANY_REQUESTS' })
  })

  test('an unknown error becomes a generic 500 and does not leak the message', async ({
    assert,
  }) => {
    const result = await run(new Error('relation "users" does not exist'))

    assert.equal(result.status, 500)
    assert.deepInclude(result.body, { status: 500, code: 'SERVER_ERROR' })
    assert.notInclude(JSON.stringify(result.body), 'users')
  })

  test('HTTPException keeps its own message and code', async ({ assert }) => {
    const result = await run(HTTPException.Conflict('já existe', 'ALREADY_EXISTS'))

    assert.equal(result.status, 409)
    assert.deepInclude(result.body, { message: 'já existe', code: 'ALREADY_EXISTS' })
  })
})
