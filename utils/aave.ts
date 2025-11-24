import { CONTRACT_ADDRESSES, GREEN_TEXT } from "./constants";
import I_POOL_JSON from "@/utils/abis/IPool.json";
import { type Abi } from "viem";
import { ViemClient } from "@dutterbutter/zksync-sdk/viem";
import type { AaveData, Summary } from "./types";

const oracleAbi = [
  {
    name: "getAssetPrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [{ name: "price", type: "uint256" }],
  },
] as const;

const BASIS_POINTS = BigInt(10_000);
const SCALE = BigInt(1_000_000);

export const getShadowAccountData = async (
  client: ViemClient,
  shadowAccount: `0x${string}`
) => {
  const accountData = await client.l1.readContract({
    address: CONTRACT_ADDRESSES.aavePool,
    abi: I_POOL_JSON.abi as Abi,
    functionName: "getUserAccountData",
    args: [shadowAccount],
  });
  if (Array.isArray(accountData)) {
    const totalCollateralBase = accountData[0];
    const totalDebtBase = accountData[1];
    const availableBorrowsBase = accountData[2];
    const userBorrowCapBase = totalDebtBase + availableBorrowsBase;

    let borrowCapUsage = 0;
    if (userBorrowCapBase !== BigInt(0)) {
      borrowCapUsage =
        Number((totalDebtBase * BigInt(10_000)) / userBorrowCapBase) / 100;
    }

    const borrowCapReached = borrowCapUsage >= 99.99;

    const ghoPriceInBase = await client.l1.readContract({
      address: CONTRACT_ADDRESSES.aaveOracle,
      abi: oracleAbi,
      functionName: "getAssetPrice",
      args: [CONTRACT_ADDRESSES.ghoTokenAddress],
    });

    const maxAdditionalGho =
      (availableBorrowsBase * BigInt(10) ** BigInt(18)) / ghoPriceInBase;

    const shadowAccountData: AaveData = {
      totalCollateralBase,
      totalDebtBase,
      availableBorrowsBase,
      userBorrowCapBase,
      borrowCapReached,
      maxAdditionalGho,
      ghoPriceInBase,
      currentLiquidationThreshold: accountData[3],
      ltv: accountData[4],
      healthFactor: accountData[5],
    };

    return shadowAccountData;
  }
};

async function getAaveEthPriceOnSepolia(client: ViemClient) {
  try {
    const price = await client.l1.readContract({
      address: CONTRACT_ADDRESSES.aaveOracle,
      abi: oracleAbi,
      functionName: "getAssetPrice",
      args: [CONTRACT_ADDRESSES.aaveWethToken],
    });

    return price;
  } catch (e) {
    console.log("Error fetching ETH price", e);
  }
}

function formatAaveETHUSD(price: bigint): number {
  const dollars = price / BigInt(100000000);
  const cents = price % BigInt(100000000);
  const decimal = cents.toString().padStart(8, "0");

  return parseFloat(`${dollars}.${decimal.slice(0, 2)}`);
}

export async function getFormattedETHUSD(client: ViemClient) {
  const price = await getAaveEthPriceOnSepolia(client);
  if (price) {
    const formatted = formatAaveETHUSD(price);
    return formatted;
  } else {
    return 4000.0;
  }
}

export function computeCurrentHealthFactor(data: AaveData): number {
  const { totalCollateralBase, totalDebtBase, currentLiquidationThreshold } =
    data;

  if (totalDebtBase === BigInt(0)) {
    // No debt → infinite HF (Aave uses max uint256)
    return Infinity;
  }
  // HF = (totalCollateralBase * liqThreshold / 10000) / totalDebtBase
  // We keep it as bigint as long as possible, then convert.
  const numerator = totalCollateralBase * currentLiquidationThreshold; // scaled by 1e8 * bps
  const denominator = totalDebtBase * BASIS_POINTS;

  // Extra scaling so we don't lose precision when converting to number.
  const hfScaled = (BigInt(numerator) * SCALE) / denominator;

  return Number(hfScaled) / Number(SCALE);
}

export function computeProjectedHealthFactorAfterGhoBorrow(
  data: AaveData,
  additionalGho: bigint // in 18 decimals
): number {
  const {
    totalCollateralBase,
    totalDebtBase,
    currentLiquidationThreshold,
    ghoPriceInBase,
  } = data;

  // Convert the extra GHO borrow to base currency (8 decimals)
  const additionalDebtBase =
    (additionalGho * ghoPriceInBase) / BigInt(10) ** BigInt(18);

  const newDebtBase = totalDebtBase + additionalDebtBase;

  if (newDebtBase === BigInt(0)) {
    return Infinity;
  }

  const numerator = totalCollateralBase * currentLiquidationThreshold; // base * bps
  const denominator = newDebtBase * BASIS_POINTS;

  const hfScaled = (numerator * SCALE) / denominator;

  return Number(hfScaled) / Number(SCALE);
}

export const getHealthFactorColor = (hf: number | undefined) => {
  if (!hf || hf >= 3) {
    return GREEN_TEXT;
  } else if (hf < 1.1) {
    return "text-[#F44336]";
  } else {
    return "text-[#FFA726]";
  }
};

export function getNetAPY(supplyUSD: number, ghoBorrowed: number) {
  // 0%
  const ETH_SUPPLY_APY = 0;
  // 2.02%
  const GHO_BORROW_APY = 0.0202;

  const supplyApyUsd = supplyUSD * ETH_SUPPLY_APY;
  const borrowApyUsd = ghoBorrowed * GHO_BORROW_APY;

  return (supplyApyUsd - borrowApyUsd) / supplyUSD;
}

export function getBorrowedAmount(
  aaveData: AaveData,
  borrowSummary: {
    totalWeiFinalizing: bigint;
    countFinalizing: number;
  }
) {
  const finalizingAmount =
    borrowSummary.totalWeiFinalizing / BigInt(10_000_000_000);
  const borrowed =
    aaveData && aaveData.totalDebtBase
      ? parseFloat(
          (
            (aaveData.totalDebtBase + finalizingAmount) /
            BigInt(100_000_000)
          ).toString()
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  return borrowed;
}

export function buildProjectedAaveDataFromHashes(
  data: AaveData,
  ethPriceUsd: number,
  depositSummary?: Summary,
  borrowSummary?: Summary
): AaveData {
  // Aave "base" in your setup is USD * 1e8 (from your sample data)
  const ethPriceBase = BigInt(Math.round(ethPriceUsd * 1e8)); // 1e8 decimals

  // Derive GHO price in base from what you already have:
  //   maxAdditionalGho = (availableBorrowsBase * 1e18) / ghoPriceInBase
  let ghoPriceInBase: bigint;
  if (data.maxAdditionalGho > BigInt(0) && data.availableBorrowsBase > BigInt(0)) {
    ghoPriceInBase =
      (data.availableBorrowsBase * BigInt(10) ** BigInt(18)) / data.maxAdditionalGho;
  } else {
    // safe default: ~1 USD (1e8) if user has 0 available borrows
    ghoPriceInBase = BigInt(10) ** BigInt(8);
  }

  // --- deltas from hashes ---

  // 1) pending ETH deposits → extra collateral in base
  const pendingCollateralBase =
    depositSummary && depositSummary.totalWeiFinalizing > BigInt(0)
      ? (depositSummary.totalWeiFinalizing * ethPriceBase) / BigInt(10) ** BigInt(18)
      : BigInt(0);

  // 2) pending GHO borrows → extra debt in base
  const pendingDebtBase =
    borrowSummary && borrowSummary.totalWeiFinalizing > BigInt(0)
      ? (borrowSummary.totalWeiFinalizing * ghoPriceInBase) / BigInt(10) ** BigInt(18)
      : BigInt(0);

  // --- projected collateral / debt ---

  const totalCollateralBase =
    data.totalCollateralBase + pendingCollateralBase;
  const totalDebtBase = data.totalDebtBase + pendingDebtBase;

  // --- recompute availableBorrowsBase and maxAdditionalGho from fundamentals ---

  const rawAvailableBorrowsBase =
    (totalCollateralBase * data.ltv) / BigInt(10_000) - totalDebtBase;

  const availableBorrowsBase =
    rawAvailableBorrowsBase > BigInt(0) ? rawAvailableBorrowsBase : BigInt(0);

  const maxAdditionalGho =
    availableBorrowsBase > BigInt(0)
      ? (availableBorrowsBase * BigInt(10) ** BigInt(18)) / ghoPriceInBase
      : BigInt(0);

  return {
    ...data,
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    maxAdditionalGho,
  };
}
