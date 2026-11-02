import { expect, test } from 'vitest'

import { contentSecurityPolicy, securityHeaders } from './security-headers'

test('the policy opens only the API when there is no storage origin', () => {
  const policy = contentSecurityPolicy(undefined)

  expect(policy).toContain("connect-src 'self' http://localhost:3333;")
  expect(policy).toContain("frame-ancestors 'none'")
})

test('the storage origin opens img-src and connect-src, without path', () => {
  const policy = contentSecurityPolicy('https://bucket.example.com/some/path')

  expect(policy).toContain(
    "connect-src 'self' http://localhost:3333 https://bucket.example.com;",
  )
  expect(policy).toContain(
    "img-src 'self' http://localhost:3333 https://bucket.example.com https://tile.openstreetmap.org",
  )
})

test('a value that is not a URL widens nothing', () => {
  expect(contentSecurityPolicy('not a url')).toBe(
    contentSecurityPolicy(undefined),
  )
})

test('every response carries the four security headers', () => {
  expect(Object.keys(securityHeaders(undefined))).toEqual([
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Strict-Transport-Security',
  ])
})
