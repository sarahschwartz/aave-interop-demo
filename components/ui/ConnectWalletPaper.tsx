import { Paper } from "@mui/material";

import ConnectButton from "../ConnectButton";
import type { Config, UseAccountReturnType } from "wagmi";
import Header from "./Header";
import Tooltip from "./Tooltip";

interface Props {
  account: UseAccountReturnType<Config>;
  isMounted: boolean;
}

export const ConnectWalletPaper = ({ account, isMounted }: Props) => {
  return (
    <>
      <Header />

      <div className="mx-8 text-gray-400 text-sm flex gap-6 mt-4">
        <div>
          <div>Net Worth</div>
          <div className="flex font-bold gap-1 text-xl">
            <span>—</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1">
            <span>Net APY</span>
            <Tooltip text={'Net APY is the combined effect of all supply and borrow positions on net worth, including incentives. It is possible to have a negative net APY if debt APY is higher than supply APY.'} /></div>
          <div className="font-bold text-xl">
            <span>—</span>
          </div>
        </div>
      </div>

      <Paper
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 2,
          m: 6,
          flex: 1,
          backgroundColor: "#292e41",
          color: "white",
        }}
      >
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="resting-gho-hat-purple.svg" alt="aave ghost"></img>
        </div>
        <>
          <div className="text-2xl font-bold">Please, connect your wallet</div>
          <div className="text-gray-400 mt-2 mb-6">
            Please connect your wallet to see your supplies, borrowings, and
            open positions.
          </div>
          {isMounted && (
            <ConnectButton account={account} isMounted={isMounted} />
          )}
        </>
      </Paper>
    </>
  );
};
