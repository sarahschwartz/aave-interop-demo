import type { Hash, WithdrawalStatus } from "@dutterbutter/zksync-sdk";

export interface HashInfo {
  hash: string;
  status: WithdrawalStatus;
}

export type DepositRow = {
  hash: Hash;
  valueWei: bigint;
  valueEth: string;
  phase: WithdrawalPhase;
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