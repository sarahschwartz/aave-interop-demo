# Aave - ZKsync - L2 -> L1 Interop Demo

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

### Add ZKsync OS Testnet to your wallet

Follow the instructions in the [ZKsync OS network details](https://docs.zksync.io/zksync-network/zksync-os/network-details) docs.

#### Bridge some ETH to the testnet

Either use the [ZKsync OS testnet portal](https://zksync-os.portal.zksync.io/bridge), or follow the instructions [here](https://docs.zksync.io/zksync-network/zksync-os/network-details).

### Install the dependencies

```bash
bun install
```

### Add a `.env` file

Use the template in `.env.example`

The private key should have some ETH on Sepolia L1.
This is used to finalize the transactions on L1.

You can get Qstash vars by signing up for a free account on [Upstash](https://console.upstash.com/).

For the L1 RPC URL, use [Infura](https://www.infura.io/).

You can get Alchemy API key on the [Alchemy](https://dashboard.alchemy.com/) site (used to fetch ETH price for gas estimation).

### Run the frontend

```bash
bun dev
```

### Run a local Upstash QStash dev server

```bash
npx @upstash/qstash-cli@latest dev
```

## Trying out the app

Make sure you are on the ZKsync OS testnet network in your wallet before connecting, and have some sepolia ETH bridged over.

Note that this app currently only support supplying ETH and borrowing GHO.
The ability to repay borrowed assets or withdraw supplied ETH isn't yet supported in this frontend.

### Troubleshooting

If the borrow transaction fails during finalization, it's probably because the gas is currently hardcoded for bridging the GHO tokens to L2.
You can fix this by increasing the `mintValue` in the `getBorrowBundle` method in `utils/txns.ts`.
