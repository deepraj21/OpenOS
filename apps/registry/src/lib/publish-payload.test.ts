import { describe, expect, it } from 'vitest'
import { parsePublishBody } from './publish-payload.js'

describe('parsePublishBody', () => {
  it('accepts a valid payload', () => {
    const p = parsePublishBody({
      version: '1.0.0',
      code: 'export default {}',
      manifest: {
        id: 'web-researcher',
        name: 'Web Researcher',
        description: 'Research',
        tags: ['demo'],
      },
    })
    expect(p.version).toBe('1.0.0')
    expect(p.manifest.id).toBe('web-researcher')
  })

  it('rejects bad semver', () => {
    expect(() =>
      parsePublishBody({
        version: 'v1',
        code: 'x',
        manifest: { id: 'a', name: 'n', description: 'd' },
      }),
    ).toThrow('semver')
  })

  it('rejects non-kebab id', () => {
    expect(() =>
      parsePublishBody({
        version: '1.0.0',
        code: 'x',
        manifest: { id: 'Bad_Id', name: 'n', description: 'd' },
      }),
    ).toThrow('kebab-case')
  })
})
