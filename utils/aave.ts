import { CONTRACT_ADDRESSES } from "./constants";
import I_POOL_JSON from "@/utils/abis/IPool.json";
import { type Abi } from "viem";
import { ViemClient } from "@dutterbutter/zksync-sdk/viem";
import { AaveData } from "./types";

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

    if (totalDebtBase > BigInt(0)) {
      const currentHF = computeCurrentHealthFactor(shadowAccountData);
      console.log("currentHF", currentHF);

      const inputDollars = 5;
      const additionalGho =
        BigInt(Math.round(inputDollars * 1e2)) *
        BigInt(10) ** (BigInt(18) - BigInt(2));

      const projectedHF = computeProjectedHealthFactorAfterGhoBorrow(
        shadowAccountData,
        additionalGho
      );
      console.log("projected HF:", projectedHF);
    }

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

export async function getFormattedETHUSD(client: ViemClient){
  const price = await getAaveEthPriceOnSepolia(client);
      if(price){
        const formatted = formatAaveETHUSD(price);
        return formatted;
      } else {
        return 4000.00;
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
