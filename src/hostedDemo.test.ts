import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })
async function helper(value = 'true', base = '/demo/') {
  vi.stubEnv('VITE_HOSTED_DEMO', value)
  vi.stubEnv('BASE_URL', base)
  vi.resetModules()
  return import('./hostedDemo')
}
describe('hosted-only fixed session decision', () => {
  it.each(['', 'false', 'TRUE', '1'])('never accesses storage in local build %s', async value => {
    const get = vi.spyOn(Storage.prototype, 'getItem')
    const set = vi.spyOn(Storage.prototype, 'setItem')
    const h = await helper(value)
    expect(h.hostedDemo).toBe(false)
    expect(h.demoAcknowledged()).toBe(true)
    h.acknowledgeDemo()
    expect(get).not.toHaveBeenCalled(); expect(set).not.toHaveBeenCalled()
  })
  it('accepts only 1, retains on reload, isolates prefixes and independent sessions', async () => {
    const key = 'vaultsort.hostedDemoAcknowledged:/demo/'
    const h = await helper()
    expect(h.hostedDemo).toBe(true)
    for (const value of ['', 'true', '0']) { sessionStorage.setItem(key, value); expect(h.demoAcknowledged()).toBe(false) }
    h.acknowledgeDemo()
    expect([...Array(sessionStorage.length)].map((_, index) => sessionStorage.key(index))).toEqual([key])
    expect(sessionStorage.getItem(key)).toBe('1')
    expect((await helper()).demoAcknowledged()).toBe(true)
    expect((await helper('true', '/other/')).demoAcknowledged()).toBe(false)
    sessionStorage.clear()
    expect(h.demoAcknowledged()).toBe(false)
  })
  it('fails closed and never logs storage exceptions', async () => {
    const h = await helper()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(h.demoAcknowledged()).toBe(false)
    expect(() => h.acknowledgeDemo()).not.toThrow()
    expect(h.demoAcknowledged()).toBe(false)
  })
})
