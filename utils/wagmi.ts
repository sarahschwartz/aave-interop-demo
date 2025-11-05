import { defineChain } from 'viem'
import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'

export const zksyncOSTestnet = defineChain({
  id: 8022833,
  name: 'ZKsync OS Developer Preview',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://zksync-os-testnet-alpha.zksync.dev/'],
      webSocket: ['wss://zksync-os-testnet-alpha.zksync.dev/ws'],
    },
  },
})


export const config = createConfig({
  chains: [zksyncOSTestnet, sepolia],
  transports: {
    [zksyncOSTestnet.id]: http(),
    [sepolia.id]: http(),
  },
})