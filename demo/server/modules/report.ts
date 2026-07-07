/**
 * "Cross-chain flow report" — the slow-origin demo endpoint (native BTC).
 * Priced above the PoA-bridge minimum for BTC deposits; long payment window.
 */

const CORRIDORS = [
  ['Bitcoin', 'NEAR'],
  ['Arbitrum', 'Solana'],
  ['Base', 'NEAR'],
  ['Ethereum', 'Bitcoin'],
] as const

export function generate(): Record<string, unknown> {
  const seed = Math.floor(Date.now() / 300_000) // rotates every 5 minutes
  const corridors = CORRIDORS.map(([from, to], index) => ({
    corridor: `${from} → ${to}`,
    netFlow: `${((seed * 7 + index * 13) % 200) - 100} units`,
    congestion: ['low', 'moderate', 'elevated'][(seed + index) % 3],
  }))
  return {
    product: 'flow-report',
    title: 'Cross-chain settlement flow report',
    window: 'trailing 24h',
    corridors,
    methodology: 'Synthetic demo content — not derived from real flows.',
    generatedAt: new Date().toISOString(),
  }
}
