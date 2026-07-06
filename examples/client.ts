/**
 * Example client for the `nearintents` payment method.
 *
 * Three ways to pay, picked automatically:
 * 1. DEPOSIT_TX_HASH set  — the deposit was already broadcast; present it.
 * 2. PRIVATE_KEY set      — broadcast the deposit on Arbitrum via viem, wait
 *                           for confirmation, then present the hash.
 * 3. Neither              — dry run: print the decoded challenge (what you
 *                           would have to pay) and exit. No funds move.
 *
 * Run:  pnpm example:client [url]           (default http://localhost:8402/premium)
 * Env:  DEPOSIT_TX_HASH   origin-chain tx hash of an already-sent deposit
 *       PRIVATE_KEY       0x… key of a funded Arbitrum account (REAL FUNDS)
 */
import { Challenge, Receipt } from 'mppx'
import { Mppx } from 'mppx/client'

import { charge } from '../src/client/Charge.js'
import type * as Types from '../src/Types.js'

const url = process.argv[2] ?? 'http://localhost:8402/premium'
const depositTxHash = process.env.DEPOSIT_TX_HASH
const privateKey = process.env.PRIVATE_KEY

const ARB_USDC = 'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const BTC = 'bip122:000000000019d6689c085ae165831e93/slip44:0'

async function makeWalletClient() {
  if (!privateKey) return undefined
  const { createWalletClient, http, publicActions } = await import('viem')
  const { privateKeyToAccount } = await import('viem/accounts')
  const { arbitrum } = await import('viem/chains')
  return createWalletClient({
    account: privateKeyToAccount(privateKey as `0x${string}`),
    chain: arbitrum,
    transport: http(),
  }).extend(publicActions)
}

const walletClient = await makeWalletClient()

const method = charge({
  ...(walletClient && { walletClient }),
  policy: {
    allowedOriginNetworks: ['eip155:42161', 'bip122:000000000019d6689c085ae165831e93'],
    // Hard safety caps: refuse any challenge asking for more than this.
    maxAmountIn: {
      [ARB_USDC]: '2000000', // 2 USDC
      [BTC]: '10000', // 10k sats
    },
  },
})

const mppx = Mppx.create({ methods: [method], polyfill: false })

// Dry run: show what the server is asking for, without paying.
if (!depositTxHash && !walletClient) {
  const probe = await fetch(url)
  if (probe.status !== 402) {
    console.log(`No payment required (HTTP ${probe.status}):`, await probe.text())
    process.exit(0)
  }
  const challenge = Challenge.fromResponse(probe)
  const request = challenge.request as Types.ChargeRequest
  console.log('402 challenge (dry run — set PRIVATE_KEY or DEPOSIT_TX_HASH to pay):')
  console.log(`  send      ${request.amount} base units of`)
  console.log(`            ${request.currency}`)
  console.log(`  to        ${request.recipient}`)
  console.log(`  memo      ${request.methodDetails.depositMemo ?? '(none)'}`)
  console.log(`  expires   ${challenge.expires}`)
  console.log(
    `  merchant receives ${request.methodDetails.amountOut} of ${request.methodDetails.destinationAsset}`,
  )
  console.log(`  refunds go to ${request.methodDetails.refundTo}`)
  process.exit(0)
}

console.log(`Paying for ${url} …`)
const response = await mppx.fetch(url, {
  ...(depositTxHash && { context: { hash: depositTxHash } }),
} as RequestInit)

console.log(`HTTP ${response.status}`)
console.log(await response.text())
if (response.ok) {
  const receipt = Receipt.fromResponse(response) as Types.NearIntentsReceipt
  console.log('Payment-Receipt:')
  console.log(`  challengeId        ${receipt.challengeId}`)
  console.log(`  originTxHash       ${receipt.originTxHash}`)
  console.log(`  reference (dest)   ${receipt.reference}`)
  console.log(`  destinationNetwork ${receipt.destinationNetwork}`)
}
