import { Skeleton } from "@mui/material";
import { StyledSwitch } from "./ui/StyledSwitch";
import type { DepositRow, HashInfo } from "@/utils/types";
import { SKELETON_STYLE } from "@/utils/constants";
import Tooltip from "./ui/Tooltip";

interface Props { 
  isLoading: boolean;
  latestHashes: HashInfo[];
  finalizingDeposits: DepositRow[];
  ethBalance: string;
}

export function SuppliedAssets({ isLoading, latestHashes, finalizingDeposits, ethBalance }: Props) {

  const tableHeaderStyle =
    "text-xs text-gray-300 border-b border-gray-500 pb-2";

  return (
    <div>
      {!isLoading && latestHashes.length === 0 ? (
        <div className="text-gray-400 text-sm mt-10">Nothing supplied yet</div>
      ) : (
        <div className="mt-8 grid grid-cols-5 w-full gap-y-4 items-center">
          <div className={tableHeaderStyle}>Assets</div>
          <div className={tableHeaderStyle}>
            <span>Balance</span>
            <Tooltip styles='ml-2' text={isLoading ? 'loading...' : finalizingDeposits && finalizingDeposits.length > 0 ? `${finalizingDeposits.length} tx still finalizing on L1` : 'all txns finalized'} />
            </div>
          <div className={tableHeaderStyle}>APY</div>
          <div className={tableHeaderStyle}>Collateral</div>
          <div className={tableHeaderStyle}><span className='opacity-0'>-</span></div>
          <div className="flex gap-1">
            {isLoading ? (
              <div className="flex gap-2">
                <Skeleton
                  sx={SKELETON_STYLE}
                  variant="circular"
                  width={35}
                  height={35}
                />
                <Skeleton sx={SKELETON_STYLE} width={35} height={35} />
              </div>
            ) : (
              <div className='flex gap-1'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="eth.svg" alt="ETH logo" className="w-6 h-6 mr-1" />
                <div>ETH</div>
              </div>
            )}
          </div>
          {isLoading ? (
            <Skeleton sx={SKELETON_STYLE} width={60} height={35} />
          ) : (
            <div>{ethBalance}</div>
          )}

          {isLoading ? (
            <Skeleton sx={SKELETON_STYLE} width={60} height={35} />
          ) : (
            <div>0%</div>
          )}

          {isLoading ? (
            <Skeleton sx={SKELETON_STYLE} width={60} height={35} />
          ) : (
            <div>
              <StyledSwitch />
            </div>
          )}

          {isLoading ? (
            <div className='flex gap-2'>
            <Skeleton sx={SKELETON_STYLE} width={60} height={55} />
            <Skeleton sx={SKELETON_STYLE} width={60} height={55} />
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button className="cursor-pointer bg-white text-black p-2 rounded-md text-sm">
                Supply
              </button>
              <button className="cursor-pointer border border-gray-600 hover:border-gray-300 bg-gray-700 py-2 px-4 rounded-md text-sm">
                Withdraw
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
