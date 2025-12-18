import { ETH_ADDRESS } from "@matterlabs/zksync-js/core";
import { ViemClient, ViemSdk } from "@matterlabs/zksync-js/viem";
import { encodeFunctionData, Abi, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { UseAccountReturnType, Config } from "wagmi";
import { CONTRACT_ADDRESSES } from "./constants";
import { DataEncoding } from "./data-encoding";
import { checkChainId } from "./helpers";
import { config, zksyncOSTestnet } from "./wagmi";

import I_WRAPPED_TOKEN_JSON from "@/utils/abis/IWrappedTokenGatewayV3.json";
import I_POOL_JSON from "@/utils/abis/IPool.json";
import I_ERC20_JSON from "@/utils/abis/IERC20.json";
import I_L1_BRIDGEHUB_JSON from "@/utils/abis/IL1Bridgehub.json";
// import I_MAILBOX_IMPL_JSON from "@/utils/abis/IMailboxImpl.json";
import L2_INTEROP_CENTER_JSON from "@/utils/abis/L2InteropCenter.json";
import ERC4626_DEPOSIT_JSON from "@/utils/abis/IERC4626StataToken.json";
import { ShadowAccountOp } from "./types";
import { estimateGas } from "@wagmi/core";

export async function getShadowAccount(
  client: ViemClient,
  address: `0x${string}`
) {
  const shadowAccount = await client.l2.readContract({
    address: CONTRACT_ADDRESSES.deployedL2InteropCenter,
    abi: L2_INTEROP_CENTER_JSON.abi as Abi,
    functionName: "l1ShadowAccount",
    args: [address],
  });
  return shadowAccount as `0x${string}`;
}

export async function getDepositBundle(
  shadowAccount: `0x${string}`,
  amount: bigint,
  account: UseAccountReturnType<Config>,
  client: ViemClient
) {
  if (!account.address) throw new Error("missing account address");
  // abi.encodeCall(IWrappedTokenGatewayV3.depositETH, (aavePool, shadowAccount, 0))
  const depositETHData = encodeFunctionData({
    abi: I_WRAPPED_TOKEN_JSON.abi as Abi,
    functionName: "depositETH",
    args: [CONTRACT_ADDRESSES.aavePool, shadowAccount, 0],
  });

const approveAWethToStataData = encodeFunctionData({
    abi: I_ERC20_JSON.abi as Abi,
    functionName: "approve",
    args: [CONTRACT_ADDRESSES.stataWeth, amount],
  });

  const depositIntoStataData = encodeFunctionData({
    abi: ERC4626_DEPOSIT_JSON as Abi,
    functionName: "deposit",
    args: [amount, shadowAccount, 0, false],
  });
  
  // const bridgeAmount = amount / BigInt(2);
    const bridgeAmount = await quoteMaxStataWethToBridge(client, amount);

  // approve stata token for withdrawal
  const approveStataTokensData = encodeFunctionData({
    abi: I_ERC20_JSON.abi as Abi,
    functionName: "approve",
    args: [CONTRACT_ADDRESSES.l1NativeTokenVaultAddress, bridgeAmount],
  });

   const { bridgeData, mintValue } = getBridgeDataAndMintValue(CONTRACT_ADDRESSES.stataWeth, bridgeAmount, account.address);

  const ops: ShadowAccountOp[] = [
    // deposit ETH to get aWETH
    {
      target: CONTRACT_ADDRESSES.aaveWeth,
      value: amount,
      data: depositETHData,
    },
    {
      // approve aWETH -> stataWETH
      target: CONTRACT_ADDRESSES.aToken,
      value: BigInt(0),
      data: approveAWethToStataData,
    },
    {
      // deposit aWETH into vault -> get stataWETH
      target: CONTRACT_ADDRESSES.stataWeth,
      value: BigInt(0),
      data: depositIntoStataData,
    },
    // approve stataWETH for bridging
    {
      target: CONTRACT_ADDRESSES.stataWeth,
      value: BigInt(0),
      data: approveStataTokensData,
    },
    // bridge stataWETH back to L2
    {
      target: CONTRACT_ADDRESSES.bridgehubAddress,
      value: mintValue,
      data: bridgeData,
    },
  ];

  return {
    address: CONTRACT_ADDRESSES.deployedL2InteropCenter,
    abi: L2_INTEROP_CENTER_JSON.abi as Abi,
    functionName: "sendBundleToL1",
    args: [ops],
  };
}

export async function getBorrowBundle(
  account: UseAccountReturnType<Config>,
  shadowAccount: `0x${string}`,
  ghoAmount: bigint,
  client: ViemClient
) {
  if (!account.address) throw new Error("missing account address");

  // abi.encodeCall(IPool.borrow, (ghoTokenAddress, ghoAmount, 2, 0, shadowAccount))
  const borrowGhoData = encodeFunctionData({
    abi: I_POOL_JSON.abi as Abi,
    functionName: "borrow",
    args: [CONTRACT_ADDRESSES.ghoTokenAddress, ghoAmount, 2, 0, shadowAccount],
  });

  // abi.encodeCall(IERC20.approve, (l1NativeTokenVaultAddress, ghoAmount))
  const approveData = encodeFunctionData({
    abi: I_ERC20_JSON.abi as Abi,
    functionName: "approve",
    args: [CONTRACT_ADDRESSES.l1NativeTokenVaultAddress, ghoAmount],
  });

  const { bridgeData, mintValue } = getBridgeDataAndMintValue(CONTRACT_ADDRESSES.ghoTokenAddress, ghoAmount, account.address);

  const ops: ShadowAccountOp[] = [
    {
      target: CONTRACT_ADDRESSES.aavePool,
      value: BigInt(0),
      data: borrowGhoData,
    },
    {
      target: CONTRACT_ADDRESSES.ghoTokenAddress,
      value: BigInt(0),
      data: approveData,
    },
    {
      target: CONTRACT_ADDRESSES.bridgehubAddress,
      value: mintValue,
      data: bridgeData,
    },
  ];

  return {
    bundle: {
      address: CONTRACT_ADDRESSES.deployedL2InteropCenter,
      abi: L2_INTEROP_CENTER_JSON.abi as Abi,
      functionName: "sendBundleToL1",
      args: [ops],
    },
    l1GasNeeded: mintValue,
  };
}

function getBridgeDataAndMintValue(tokenAddress: `0x${string}`, amount: bigint, l2Receiver: `0x${string}`){
  const mintValue = parseEther("0.003");

  const assetId = DataEncoding.encodeNTVAssetId(
    BigInt(sepolia.id),
    tokenAddress
  );
  const inner = DataEncoding.encodeBridgeBurnData(
    amount,
    l2Receiver,
    tokenAddress
  );
  const secondBridgeCalldata =
    DataEncoding.encodeAssetRouterBridgehubDepositData(assetId, inner);

    const l2GasLimit = BigInt(5_000_000);
  const l2GasPerPubdataByteLimit = BigInt(800);

  const bridgeData = encodeFunctionData({
    abi: I_L1_BRIDGEHUB_JSON.abi as Abi,
    functionName: "requestL2TransactionTwoBridges",
    args: [
      {
        chainId: zksyncOSTestnet.id,
        mintValue,
        l2Value: BigInt(0),
        l2GasLimit,
        l2GasPerPubdataByteLimit,
        refundRecipient: l2Receiver,
        secondBridgeAddress: CONTRACT_ADDRESSES.l1AssetRouterAddress,
        secondBridgeValue: BigInt(0),
        secondBridgeCalldata,
      },
    ],
  });

  return { bridgeData, mintValue }
}

export function getWithdrawParams(
  amount: bigint,
  shadowAccount: `0x${string}`
) {
  return {
    token: ETH_ADDRESS,
    amount,
    to: shadowAccount as `0x${string}`,
  } as const;
}

export async function getWithdrawEstimate(
  amount: bigint,
  sdk: ViemSdk,
  shadowAccount: `0x${string}`
) {
  const params = getWithdrawParams(amount, shadowAccount);
  const prepared = await sdk.withdrawals.prepare(params);
  const estimate = await estimateGas(config, {
    ...prepared,
    chainId: zksyncOSTestnet.id,
  });
  return estimate;
}

export async function initWithdraw(
  account: UseAccountReturnType<Config>,
  amount: bigint,
  sdk: ViemSdk,
  shadowAccount: `0x${string}`
) {
  try {
    await checkChainId(account);

    const params = getWithdrawParams(amount, shadowAccount);

    console.log("creating withdraw txn...");
    const created = await sdk.withdrawals.create(params);

    const hash = created.l2TxHash;
    if (!hash) {
      console.log("ERROR: no hash");
      return;
    }
    console.log("withdraw created:", hash);

    return hash;
  } catch (e) {
    alert("something went wrong");
    console.log("ERROR:", e);
    return;
  }
}


export async function quoteMaxStataWethToBridge(
  client: ViemClient,
  amount: bigint,
) {
  let shares: bigint;
  const contractData = {
    address: CONTRACT_ADDRESSES.stataWeth,
      abi: ERC4626_DEPOSIT_JSON as Abi,
  };
  try {
    shares = await client.l1.readContract({
      ...contractData,
      functionName: "convertToShares",
      args: [amount],
    }) as bigint;
  } catch {
    shares = await client.l1.readContract({
      ...contractData,
      functionName: "previewDeposit",
      args: [amount],
    }) as bigint;
  }

  // subtract 100 wei of shares to avoid any rounding/index drift.
  const maxBridgeShares = shares > BigInt(0) ? shares - BigInt(100) : BigInt(0);

  return maxBridgeShares;
}
