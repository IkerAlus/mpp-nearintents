import { createWalletClient, custom, publicActions } from 'viem'
import { arbitrum } from 'viem/chains'

/** Injected-wallet (EIP-1193) connection pinned to Arbitrum One. */
export type ConnectedWallet = {
  address: `0x${string}`
  client: ReturnType<typeof buildClient>
}

function buildClient(ethereum: unknown, account: `0x${string}`) {
  return createWalletClient({
    account,
    chain: arbitrum,
    transport: custom(ethereum as Parameters<typeof custom>[0]),
  }).extend(publicActions)
}

export async function connectArbitrumWallet(): Promise<ConnectedWallet> {
  const ethereum = (window as { ethereum?: unknown }).ethereum
  if (!ethereum)
    throw new Error('No injected wallet found — install MetaMask, or pay manually with a tx hash.')

  const probe = createWalletClient({
    chain: arbitrum,
    transport: custom(ethereum as Parameters<typeof custom>[0]),
  })
  const [address] = await probe.requestAddresses()
  if (!address) throw new Error('Wallet connection was rejected.')

  try {
    await probe.switchChain({ id: arbitrum.id })
  } catch {
    await probe.addChain({ chain: arbitrum })
    await probe.switchChain({ id: arbitrum.id })
  }

  return { address, client: buildClient(ethereum, address) }
}
