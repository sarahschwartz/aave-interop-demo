import { type ViemSdk } from "@dutterbutter/zksync-sdk/viem";
import { useEffect } from "react";

export function SuppliedAssets({ sdk }: { sdk: ViemSdk }){

    // TODO: fetch status for latest 5 deposits
    useEffect(() => {
        async function checkStatus() {
          if (!sdk) return;
          const latestHashes = localStorage.getItem("latestAaveZKsyncDeposits");
          console.log("latest Hashes:", latestHashes);
        //   if (!lastHash) return;
        //   const status = await sdk.withdrawals.status(lastHash as `0x${string}`);
        //   console.log("status:", status);
    
        //   switch (status.phase) {
        //     case "FINALIZED":
        //       setIsSuccess(true);
        //       break;
        //     case "UNKNOWN":
        //       break;
        //     default:
        //       setIsPending(true);
        //       break;
        //   }
        }
    
        checkStatus();
      }, [sdk]);

    return (
        <div>
            (Supplied Assets)
        </div>
    )
}