# mpp-nearintents

Reference implementation of the **`nearintents` payment method** for
[MPP (Machine Payments Protocol)](https://mpp.dev) — cross-chain HTTP 402
payments settled by [NEAR Intents](https://near-intents.org): clients pay on
any supported chain, merchants receive an exact amount on theirs. Extends
[`mppx`](https://github.com/wevm/mppx).

> **Status: pre-release.** M0 (scaffold + conformance fixtures + mock 1Click),
> M1 (core modules), and M2 (server + client `charge()` methods with the full
> mock-1Click e2e suite) are complete. Examples + a live smoke test (M3) and
> distribution (M4) remain. Not yet published to npm.

## Usage

Server (see [`src/server/Charge.ts`](src/server/Charge.ts) for all options):

```ts
import { Mppx } from 'mppx/server'
import { nearintents } from 'mpp-nearintents/server'

const mppx = Mppx.create({
  secretKey: process.env.MPP_SECRET_KEY!,
  methods: [
    nearintents.charge({
      originAsset: 'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      destinationAsset: 'near:mainnet/nep141:1720…33a1',
      destinationRecipient: 'merchant.near',
      refundTo: '0x2527…C317', // merchant origin-chain refund address
      amountOut: '1000000', // exact amount the merchant receives (EXACT_OUTPUT)
      oneClick: { jwt: process.env.ONE_CLICK_JWT },
      // production: store: Store.redis(client) — replay protection needs an atomic store
    }),
  ],
})
```

Client (policy is the safety surface — the client pays before delivery):

```ts
import { Mppx } from 'mppx/client'
import { nearintents } from 'mpp-nearintents/client'

const mppx = Mppx.create({
  methods: [
    nearintents.charge({
      walletClient, // viem WalletClient (+ public actions) for eip155 origins
      policy: {
        allowedOriginNetworks: ['eip155:42161'],
        maxAmountIn: { 'eip155:42161/erc20:0xaf88…5831': '5000000' },
      },
    }),
  ],
})
const response = await mppx.fetch('https://api.example.com/paid-resource')
```

Non-EVM origins (BTC, Solana, …) pay via the `sendDeposit` callback or present
an already-broadcast tx hash as `context.hash`.

## Examples

[`examples/server.ts`](examples/server.ts) is a two-route merchant (Arbitrum
USDC origin with a 5-minute window, native BTC origin with a 45-minute
window); [`examples/client.ts`](examples/client.ts) pays it — or dry-runs,
printing the decoded challenge, when no key/hash is provided.

```sh
cp .env.example .env            # add ONE_CLICK_JWT (and merchant addresses)
pnpm example:server             # http://localhost:8402
pnpm example:client             # dry run: shows what /premium asks for
pnpm example:client http://localhost:8402/premium-btc
```

To execute a real payment (real funds!): set `PRIVATE_KEY` to a funded
Arbitrum account and run `pnpm example:client`, or send the deposit yourself
and re-run with `DEPOSIT_TX_HASH=0x…`. The client refuses anything beyond its
configured `policy.maxAmountIn` caps.

## Operational notes

- **Trust model.** Settlement is not trustless: for the duration of the swap
  the deposit is custodied by the NEAR Intents settlement system
  (`methodDetails.settlementBackend: "near-intents"`), which either delivers
  the destination asset to the merchant or refunds the deposit. Comparable to
  entrusting a payment processor with a transfer; agents applying per-method
  risk policies can key off the `method` and `settlementBackend` fields.
- **Refunds.** `methodDetails.refundTo` is a **merchant-configured** address
  on the origin chain (the server cannot know the payer before payment).
  Every non-success terminal refunds the deposit there; payers recover
  off-band per the merchant's terms. Disclose this in your terms of service.
- **Per-origin expiry.** Size `expiresWindow` (and the mppx route `expires`)
  to the origin chain: minutes for fast chains, 45–60 minutes for Bitcoin.
  The example server creates the route handler per request so the absolute
  mppx `expires` becomes a rolling window.
- **Per-origin minimums.** Bridged origins enforce minimum deposit amounts
  (e.g. native BTC rides the PoA bridge, minimum ≈ a few USD at the time of
  writing — live 1Click rejects quotes below it with `400 Amount is too low
  for bridge`). Micro-prices belong on fast, cheap origins like Arbitrum/Base.
- **Slow settlements.** `verify` holds the connection at most
  `settlementTimeout` seconds, then returns **504** with a problem body —
  the credential is *not* consumed and the client re-presents the same
  credential later (the deposit keeps settling in the background). Backend
  unavailability returns **503**, never `verification-failed`. Long-running
  origins can layer a `202 Accepted`/webhook pattern on top; that is out of
  scope for this package.
- **After a failed settlement** the immediate 402 echoes the spent challenge
  (mppx computes the retry challenge before `verify` runs); the client's next
  request receives a fresh quote. Conformant clients re-request on 402.

## How it works

1. The server answers an unpaid request with `402` + `WWW-Authenticate:
   Payment` whose `request` carries a unique, single-use **1Click deposit
   address** as `recipient`, the origin-chain leg the client pays (`amount`,
   `currency`), and the merchant's destination leg in `methodDetails`.
2. The client pays the source asset on its origin chain and retries with the
   confirmed transaction hash as a `{type: "hash"}` credential.
3. The server verifies the deposit via the 1Click status endpoint, drives the
   cross-chain swap to `SUCCESS`, and returns the resource with a
   `Payment-Receipt` carrying `challengeId`, `originTxHash`, and the
   destination-chain delivery hash.

Quotes use `EXACT_OUTPUT`, so the merchant receives a deterministic amount of
its chosen asset on its chosen chain. 

Note that settlement is not trustless: deposits
are custodied by the NEAR Intents settlement system for the duration of the
swap, with automatic refunds to `methodDetails.refundTo` on every non-success
outcome. See the spec's Trust Model section.

## Spec

The normative wire contract is
[`docs/spec/draft-nearintents-charge-00.md`](docs/spec/draft-nearintents-charge-00.md)
(registered in
[`tempoxyz/mpp-specs`](https://github.com/tempoxyz/mpp-specs) under
`specs/methods/nearintents/`). Conformance vectors in
[`test/vectors.test.ts`](test/vectors.test.ts) are generated through mppx
primitives from the spec's examples.

## Development

```sh
npx pnpm@11 install   # pnpm pinned via packageManager
pnpm check            # typecheck + lint + tests
```

Tests are **mock-only** (in-process mock 1Click server in
[`test/OneClickMock.ts`](test/OneClickMock.ts)); the suite never calls live
1Click.

Note: the `mppx` dependency is patched
([`patches/mppx@0.8.5.patch`](patches/mppx@0.8.5.patch)) with the upstream
receipt-extensibility fix ([wevm/mppx#612](https://github.com/wevm/mppx/pull/612),
merged but not yet released) so method-specific receipt fields
(`challengeId`, `originTxHash`, `destinationNetwork`) survive the
`Payment-Receipt` codec. The patch is dropped as soon as the first mppx
release > 0.8.5 ships.

## License

[MIT](LICENSE)
