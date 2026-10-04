export const hostedDemo = import.meta.env.VITE_HOSTED_DEMO === 'true'
const key = `vaultsort.hostedDemoAcknowledged:${import.meta.env.BASE_URL}`

export function demoAcknowledged() {
  if (!hostedDemo) return true
  try { return sessionStorage.getItem(key) === '1' } catch { return false }
}

export function acknowledgeDemo() {
  if (!hostedDemo) return
  try { sessionStorage.setItem(key, '1') } catch { /* Continue permits only the current picker attempt. */ }
}
