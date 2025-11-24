import { ETH_ADDRESS } from "@dutterbutter/zksync-sdk/core";
import { ViemClient, ViemSdk } from "@dutterbutter/zksync-sdk/viem";
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
  amount: bigint
) {
  // abi.encodeCall(IWrappedTokenGatewayV3.depositETH, (aavePool, shadowAccount, 0))
  const depositETHData = encodeFunctionData({
    abi: I_WRAPPED_TOKEN_JSON.abi as Abi,
    functionName: "depositETH",
    args: [CONTRACT_ADDRESSES.aavePool, shadowAccount, 0],
  });

  const ops: ShadowAccountOp[] = [
    {
      target: CONTRACT_ADDRESSES.aaveWeth,
      value: amount,
      data: depositETHData,
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

  const gasPrice = await client.l1.getGasPrice();
  const l2GasLimit = BigInt(5_000_000);
  const l2GasPerPubdataByteLimit = BigInt(800);

  // TODO: figure out correct calculation - this one returns a value that's too high
  // const baseCost = await client.l1.readContract({
  //   address: CONTRACT_ADDRESSES.chainMailBoxAddress,
  //   abi: I_MAILBOX_IMPL_JSON.abi as Abi,
  //   functionName: "l2TransactionBaseCost",
  //   args: [gasPrice, l2GasLimit, l2GasPerPubdataByteLimit],
  // });

  // console.log('basecost:', baseCost)

  // const mintValue =
  //   typeof baseCost === "bigint" ? baseCost + BigInt(1_000) : BigInt(5_000_000_000_000_000);
  console.log("L1 Gas Price", gasPrice);
  const mintValue = parseEther("0.00135");

  const ghoTokenAssetId = DataEncoding.encodeNTVAssetId(
    BigInt(sepolia.id),
    CONTRACT_ADDRESSES.ghoTokenAddress
  );
  const inner = DataEncoding.encodeBridgeBurnData(
    ghoAmount,
    account.address,
    CONTRACT_ADDRESSES.ghoTokenAddress
  );
  const secondBridgeCalldata =
    DataEncoding.encodeAssetRouterBridgehubDepositData(ghoTokenAssetId, inner);

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
        refundRecipient: account.address,
        secondBridgeAddress: CONTRACT_ADDRESSES.l1AssetRouterAddress,
        secondBridgeValue: BigInt(0),
        secondBridgeCalldata,
      },
    ],
  });

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
