import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const workflow = () => readFileSync('.github/workflows/ci.yml', 'utf8')
const job = (name: string) => workflow().split(`  ${name}:\n`)[1]!.split(/\n {2}[\w-]+:\n/)[0]!

describe('mandatory main-bound verification', () => {
  it('verifies both main-bound events without filters or privileged triggers', () => {
    const source = workflow()
    expect(source).toContain('push:\n    branches: [main]')
    expect(source).toContain('pull_request:\n    branches: [main]')
    expect(source).not.toMatch(/pull_request_target|workflow_run|paths:|paths-ignore:|continue-on-error|always\(\)/)
  })
  it('runs each required command in order with read-only authority on the event SHA', () => {
    const verify = job('verify')
    expect(verify).toContain('runs-on: ubuntu-latest')
    expect(verify).toContain('contents: read')
    expect(verify).not.toMatch(/pages:|id-token:|secrets\.|if:/)
    expect(verify).toContain('ref: ${{ github.sha }}')
    expect(verify).toContain('persist-credentials: false')
    expect(verify).toContain("node-version: '24'")
    expect([...verify.matchAll(/run: (npm [^\n]+)/g)].map(match => match[1])).toEqual(['npm ci', 'npm run lint', 'npm test', 'npm run build'])
    // Failure or cancellation grants no publication eligibility: no override of fail-stop steps.
    expect(verify).not.toContain('VAULTSORT_PAGES_ENABLED')
    for (const action of verify.matchAll(/uses: ([^\n]+)/g)) expect(action[1]).toMatch(/^actions\/[\w-]+@[a-f0-9]{40} # v\d/)
  })
})
