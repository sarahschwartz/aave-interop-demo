import { GRADIENT } from "@/utils/constants";
import Header from "./ui/Header";
import { SkeletonBasic } from "./ui/SkeletonSupplies";
import { getHealthFactorColor } from "@/utils/aave";

export default function Stats({
  usdValue,
  isLoading,
  healthFactor,
}: {
  usdValue: number;
  isLoading: boolean;
  healthFactor?: number;
}) {
  return (
    <>
      <Header />
      <div className="mx-8 text-gray-400 text-sm flex gap-6 mt-4">
        <div>
          <div>Net Worth</div>
          {isLoading ? (
            <SkeletonBasic />
          ) : (
            <div className="flex font-bold gap-1 text-xl">
              <span>$</span>
              <span className="text-white">
                {usdValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>

        <div>
          <div>Net APY</div>
          <div className="font-bold text-xl">
            {isLoading ? (
              <SkeletonBasic />
            ) : (
              <div>
                {usdValue > 0 ? (
                  <span>
                    <span className="text-white">0</span> %
                  </span>
                ) : (
                  <span>-</span>
                )}
              </div>
            )}
          </div>
        </div>

        {healthFactor && healthFactor < 1_000_000_000 && (
          <div>
            <div>Health Factor</div>

            <div className='flex gap-1 items-center'>
              <span className={`font-bold text-xl items-center ${getHealthFactorColor(healthFactor)}`}>
                {healthFactor.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                </span>
                <button className="cursor-pointer px-2 h-6 border border-gray-500 text-[10px] font-semibold rounded-sm text-white bg-gray-700 hover:bg-gray-900">RISK DETAILS</button>
            </div>
          </div>
        )}

        <div>
          <div>Available rewards</div>
          {isLoading ? (
            <SkeletonBasic />
          ) : (
            <div className="flex font-bold gap-1 text-xl items-center">
              <span>$</span>
              <span className="text-white">0</span>
              <button
                className="text-white rounded-md px-1.5 ml-1 text-[10px] cursor-pointer h-5"
                style={{ background: GRADIENT }}
              >
                CLAIM
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
