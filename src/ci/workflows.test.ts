import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
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

describe('optional verified Pages publication', () => {
  it('isolates eligibility, permissions, artifact provenance and publication locking', () => {
    const build = job('demo-build'), deploy = job('deploy')
    for (const source of [build, deploy]) {
      for (const constraint of ["github.event_name == 'push'", "github.ref == 'refs/heads/main'", '!github.event.repository.fork', "vars.VAULTSORT_PAGES_ENABLED == 'true'"]) expect(source).toContain(constraint)
      expect(source).not.toMatch(/continue-on-error|always\(\)/)
    }
    expect(build).toContain('needs: verify')
    expect(build).toContain('ref: ${{ github.sha }}')
    expect(build).toContain('persist-credentials: false')
    expect(build).toContain('pages: read')
    expect(build).not.toMatch(/pages: write|id-token: write/)
    expect(build).toContain('enablement: false')
    expect(build).toContain("VITE_HOSTED_DEMO: 'true'")
    expect(build).toContain('npm run build -- --base "${PAGES_BASE_PATH}/"')
    expect(build).toContain('find dist -type l -print -quit')
    expect(build).toContain('path: dist')
    expect(deploy).toContain('needs: [verify, demo-build]')
    expect(deploy).toContain('name: github-pages')
    expect(deploy).toContain('pages: write')
    expect(deploy).toContain('id-token: write')
    expect(deploy).toContain('group: vaultsort-pages-publication')
    expect(deploy).toContain('cancel-in-progress: false')
    expect(deploy).toContain('queue: max')
    expect(job('verify') + build).not.toContain('concurrency:')
    expect(deploy).not.toMatch(/actions\/checkout|npm |download-artifact/)
    expect(deploy).toContain("if: steps.freshness.outputs.fresh == 'true'")
    expect(deploy.indexOf('# freshness-end')).toBeLessThan(deploy.indexOf('uses: actions/deploy-pages@'))
    for (const action of workflow().matchAll(/uses: ([^\n]+)/g)) expect(action[1]).toMatch(/^actions\/[\w-]+@[a-f0-9]{40} # v\d/)
  })

  const a = 'a'.repeat(40), b = 'b'.repeat(40)
  async function guard(current: unknown, sha = a, status = 200, transportError = false) {
    const script = workflow().split('# freshness-start\n')[1]!.split('# freshness-end')[0]!.split('\n').map(line => line.replace(/^ {12}/, '')).join('\n')
    const writes: string[] = [], requests: string[] = [], errors: string[] = []
    const process = { env: { REPOSITORY: 'owner/repo', SOURCE_SHA: sha, GH_TOKEN: 'synthetic-token', GITHUB_API_URL: 'https://api.github.test', GITHUB_OUTPUT: 'output', GITHUB_STEP_SUMMARY: 'summary' }, exitCode: 0 }
    await runInNewContext(script, {
      require: () => ({ appendFileSync: (path: string, data: string) => writes.push(`${path}:${data}`) }),
      process, AbortSignal,
      fetch: async (url: string) => {
        requests.push(url)
        if (transportError) throw new Error('transport')
        return { ok: status === 200, status, json: async () => current }
      },
      console: { error: (message: string) => errors.push(message) },
    })
    expect(requests).toEqual(['https://api.github.test/repos/owner/repo/git/ref/heads/main'])
    return { writes, errors, failed: process.exitCode !== 0 }
  }
  const ref = (sha: string) => ({ ref: 'refs/heads/main', object: { type: 'commit', sha } })
  it('checks current main anew on every attempt/rerun, skipping stale output in either order', async () => {
    expect((await guard(ref(a))).writes).toContain('output:fresh=true\n')
    // A holds publication lock first: B may publish only after A completes.
    expect((await guard(ref(b), b)).writes).toContain('output:fresh=true\n')
    // B publishes first: late A and old/job-only reruns must skip, not roll back.
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await guard(ref(b), a)
      expect(result.failed).toBe(false)
      expect(result.writes).toContain('output:fresh=false\n')
      expect(result.writes.join('')).toContain('stale')
    }
  })
  it.each([null, {}, { object: { sha: a } }, { ref: 'refs/heads/main', object: { type: 'tag', sha: a } }, { ref: 'refs/heads/main', object: { type: 'commit', sha: [a] } }, ref('bad')])('fails closed on malformed/missing ref %j', async value => {
    const result = await guard(value)
    expect(result.failed).toBe(true); expect(result.writes).toEqual([])
  })
  it('fails closed on HTTP/transport failures without leaking credentials or response bodies', async () => {
    for (const result of [await guard(ref(a), a, 403), await guard(ref(a), a, 200, true)]) {
      expect(result.failed).toBe(true); expect(result.writes).toEqual([])
      expect(result.errors).toEqual(['Current-main check failed; publication blocked.'])
    }
  })
})
