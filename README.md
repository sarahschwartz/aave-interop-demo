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

## How it works

Note that the implementation in this repo is just meant as a demo.
It is not meant for production use!

### Supplying ETH

The user signs two transactions:

1. A regular withdraw transaction that withdraws some ETH to their shadow account on the L1.
    For this the app uses the [`zksync-sdk`](https://zksync-sdk.mintlify.app/)'s `sdk.withdrawals.create` method to create a new withdrawal. This happens in the `initWithdraw` function in `utils/txns.ts`.
    The shadow account address can be fetched by calling the interop center contract, as shown in the `getShadowAccount` function also in `utils/txns.ts`.
    The shadow account is a smart contract account that gets deployed automatically when the bundle is first executed on the L1.
2. A transaction bundle with instructions to deposit the withdrawn amount into a pool on Aave.
    The bundle is fetched using the `getDepositBundle` function in `utils/txns.ts`.
    The function returns a transaction that can be passed into `viem`'s `writeContract` method.
    The transaction calls the interop center contract's `sendBundleToL1` method with an array of the user operations (in this case there is just one, but this can be configured to send multiple operations for the L1 shadow account to execute).
    The operation is an object with the target, value, and data of the transaction to execute.
    In this case, the target is the Aave wETH contract, the amount to supply, and the encoded function data to deposit the ETH.

Once the transactions are signed, their hashes are sent to the `start-withdraw` endpoint as well as stored in local storage for the app to keep track of.

The `start-withdraw` endpoint simply forwards the hashes to the Upstach server with a 5 minute delay.
After 5 minutes, the server calls the `finalize-withdraw` endpoint to finalize the withdrawal and execute the transaction bundle on the L1.
This is where the private key in the `env` is used.
Once this the finalization is complete, the frontend will remove the stored hashes from local storage.

### Borrowing GHO

Again the user signs two transactions here:

1. A regular withdraw transaction for a fixed amount of ETH that will be used to cover the gas needed to bridge the GHO back to the L2.
    As noted in the troubleshooting section, this value is currently hardcoded in the `mintValue` variable in the `getBorrowBundle` function in `utils/txns.ts`, which gets returned as `l1GasNeeded`.
    For production, ideally this variable is computed to reflect the actual gas needed.
2. Another transaction bundle to borrow GHO against the supplied ETH and bridge it back to the L2.
    The logic for this can be found in the `getBorrowBundle` function in `utils/txns.ts`.
    The same principle for the bundle is used as described above, but this time there are three user operations sent in the bundle: borrow the GHO, approve sending the GHO token, and bridging the token to the original sender on the L2.

Once the transactions are signed, the same flow is used as for supplying ETH.
The transactions are finalized on the L1, and tracked on the frontend by storing the hashes in local storage.

### Known issues

- There is no logic to handle if finalization on L1 fails.
- The gas amount needed to bridge the GHO back to the L2 is currently hardcoded, so it may be too little or too much.
- The bundles for withdrawing supplied ETH or replaying borrowed GHO is not implemented.
- There is no support for supplying or borrowing any other assets.
- The L1 finalization time is expected to be less than 5 mintues, but it may be different in production.
