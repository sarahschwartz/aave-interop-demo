# Aave - ZKsync - L2 -> L1 Interop Demo

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

### Install the dependencies

```bash
bun install
```

### Add a `.env` file

Use the template in `.env.example`

The private key should have funds on Sepolia L1.
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
