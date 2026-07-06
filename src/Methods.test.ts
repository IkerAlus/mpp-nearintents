import { describe, expect, test } from 'vitest'

import * as Methods from './Methods.js'

describe('Methods.charge', () => {
  test('wire identifiers match the spec registrations', () => {
    expect(Methods.charge.name).toBe('nearintents')
    expect(Methods.charge.intent).toBe('charge')
  })

  test('exposes the request and credential payload schemas', () => {
    expect(Methods.charge.schema.request).toBeDefined()
    expect(Methods.charge.schema.credential.payload).toBeDefined()
  })
})
