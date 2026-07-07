/**
 * "Alpha terminal" — the cheap, fast-origin demo endpoint (USDC on Arbitrum).
 * Self-contained content generator; no external APIs.
 */

const ASSETS = ['NEAR', 'BTC', 'ETH', 'SOL', 'ARB', 'USDC velocity', 'solver spread']
const SIGNALS = [
  'accumulating quietly',
  'showing cross-chain rotation',
  'diverging from funding rates',
  'compressing into a decision point',
  'leading the intents-volume basket',
  'lagging its bridge-flow baseline',
]
const HORIZONS = ['intraday', '48h', 'one week', 'two weeks']

function pick<t>(list: readonly t[], seed: number, salt: number): t {
  return list[(seed * 31 + salt * 17) % list.length]!
}

export function generate(): Record<string, unknown> {
  const seed = Math.floor(Date.now() / 60_000) // rotates every minute
  const conviction = 55 + ((seed * 13) % 40)
  return {
    product: 'alpha-terminal',
    insight: `${pick(ASSETS, seed, 1)} is ${pick(SIGNALS, seed, 2)} on the ${pick(HORIZONS, seed, 3)} horizon.`,
    conviction: `${conviction}%`,
    disclaimer: 'Synthetic demo content — not financial advice.',
    generatedAt: new Date().toISOString(),
  }
}
