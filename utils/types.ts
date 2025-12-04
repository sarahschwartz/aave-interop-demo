import type { Address, Hash, Hex } from "@matterlabs/zksync-js";

export type HashItem = {
  withdrawHash: Hash;
  bundleHash: Hash;
};

export type WithdrawalPhase =
  | "L2_PENDING" // tx not in an L2 block yet
  | "L2_INCLUDED" // we have the L2 receipt
  | "PENDING" // inclusion known; proof data not yet derivable/available
  | "READY_TO_FINALIZE" // Ready to call finalize on L1
  | "FINALIZING" // L1 tx sent but not picked up yet
  | "FINALIZED" // L2-L1 tx finalized on L1
  | "FINALIZE_FAILED" // prior L1 finalize reverted
  | "UNKNOWN";

export type AaveData = {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  userBorrowCapBase: bigint;
  borrowCapReached: boolean;
  maxAdditionalGho: bigint;
  ghoPriceInBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
};

export type ShadowAccountOp = {
  target: Address;
  value: bigint;
  data: Hex;
};

export interface Balance {
  decimals: number;
  formatted: string;
  symbol: string;
  value: bigint;
}

export interface Summary {
    totalWeiFinalizing: bigint;
    countFinalizing: number;
}