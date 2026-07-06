# mpp-nearintents

Reference implementation of the **`nearintents` payment method** for
[MPP (Machine Payments Protocol)](https://mpp.dev) — cross-chain HTTP 402
payments settled by [NEAR Intents](https://near-intents.org): clients pay on
any supported chain, merchants receive an exact amount on theirs. Extends
[`mppx`](https://github.com/wevm/mppx).

> **Status: pre-release.** M0 (scaffold + conformance fixtures + mock 1Click)
> and M1 (core modules) are complete; the server/client `charge()` methods
> (M2), examples (M3), and distribution (M4) are in progress. Not yet
> published to npm.

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
its chosen asset on its chosen chain. Settlement is not trustless: deposits
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
