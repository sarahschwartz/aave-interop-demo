import StyledToggleGroup from "@/components/ui/StyledToggleGroup";
import StyledToggleButton from "@/components/ui/StyledToggleButton";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Dispatch, SetStateAction, useState } from "react";
import AssetsToSupply from "./AssetsToSupply";
import { type ViemSdk } from "@dutterbutter/zksync-sdk/viem";
import { SuppliedAssets } from "./SuppliedAssets";
import type { DepositRow, HashInfo } from "@/utils/types";

interface Props {
  sdk?: ViemSdk;
  isLoading: boolean;
  latestHashes: HashInfo[];
  finalizingDeposits: DepositRow[];
  ethBalance: string;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  updateCount: number;
  ethPrice: number;
  usdValue: number;
}

export default function SupplyAndBorrow({
  sdk,
  isLoading,
  latestHashes,
  finalizingDeposits,
  ethBalance,
  setUpdateCount,
  updateCount,
  ethPrice,
  usdValue,
}: Props) {
  const [mode, setMode] = useState<"supply" | "borrow" | "">("supply");
  const [assetsToSupplyCollapsed, setAssetsToSupplyCollapsed] =
    useState<boolean>(false);
  const [suppliedAssetsCollapsed, setSuppliedAssetsCollapsed] =
    useState<boolean>(false);
  const { breakpoints } = useTheme();
  const isDesktop = useMediaQuery(breakpoints.up(1260));

  const collapseStyles = (collapsed: boolean) => {
    return {
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      minHeight: "28px",
      pl: 3,
      fontSize: '14px',
      color: '#a5a8b6',
      span: {
        width: "14px",
        height: "2px",
        bgcolor: "#a5a8b6",
        position: "relative",
        ml: 1,
        "&:after": {
          content: "''",
          position: "absolute",
          width: "14px",
          height: "2px",
          bgcolor: "#a5a8b6",
          transition: "all 0.2s ease",
          transform: collapsed ? "rotate(90deg)" : "rotate(0)",
          opacity: collapsed ? 1 : 0,
        },
      },
    };
  };

  return (
    <>
      {/* SUPPLY/BORROW TABS */}
      <div className={isDesktop ? "hidden" : "block"}>
        <StyledToggleGroup
          color="primary"
          value={mode}
          exclusive
          onChange={(_, value) => setMode(value)}
          className={"w-[400px] h-11 mt-12"}
        >
          <StyledToggleButton value="supply" disabled={mode === "supply"}>
            <Typography sx={{ textTransform: "none" }}>
              <span className="font-bold text-sm">Supply</span>
            </Typography>
          </StyledToggleButton>
          <StyledToggleButton value="borrow" disabled={mode === "borrow"}>
            <Typography sx={{ textTransform: "none" }}>
              <span className="font-bold text-sm">Borrow</span>
            </Typography>
          </StyledToggleButton>
        </StyledToggleGroup>
      </div>

      <div className="text-white mt-8 flex gap-4">
        {/* SUPPLY */}
        <div
          className={
            isDesktop || mode === "supply"
              ? "flex gap-4 flex-col w-full"
              : "hidden"
          }
        >
          <div
            className="w-full p-6 border border-gray-700 rounded-sm"
            style={{ backgroundColor: "var(--container)" }}
          >
            <div className='flex justify-between'>
            <h3 className="font-bold text-lg">Your supplies</h3>
            {latestHashes.length > 0 && (
            <Box
              sx={() => collapseStyles(suppliedAssetsCollapsed)}
              onClick={() =>
                setSuppliedAssetsCollapsed(!suppliedAssetsCollapsed)
              }
            >
              {suppliedAssetsCollapsed ? <div>Show</div> : <div>Hide</div>}
              <span />
            </Box>
            )}
            </div>
            {!suppliedAssetsCollapsed && (
              <SuppliedAssets
                isLoading={isLoading}
                latestHashes={latestHashes}
                finalizingDeposits={finalizingDeposits}
                ethBalance={ethBalance}
                usdValue={usdValue}
              />
            )}
          </div>

          <div
            className="w-full p-6 border border-gray-700 rounded-sm"
            style={{ backgroundColor: "var(--container)" }}
          >
            <div className='flex justify-between'>
            <h3 className="font-bold text-lg">Assets to supply</h3>
            <Box
              sx={() => collapseStyles(assetsToSupplyCollapsed)}
              onClick={() =>
                setAssetsToSupplyCollapsed(!assetsToSupplyCollapsed)
              }
            >
              {assetsToSupplyCollapsed ? <div>Show</div> : <div>Hide</div>}
              <span />
            </Box>
            </div>
            {!assetsToSupplyCollapsed && (
              <AssetsToSupply
                sdk={sdk}
                setUpdateCount={setUpdateCount}
                updateCount={updateCount}
                ethPrice={ethPrice}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {/* BORROW */}
        <div
          className={
            isDesktop || mode === "borrow"
              ? "flex gap-4 flex-col w-full"
              : "hidden"
          }
        >
          <div
            className="p-6 border border-gray-700 rounded-sm"
            style={{ backgroundColor: "var(--container)" }}
          >
            <h3 className="font-bold text-lg">Assets to borrow</h3>
            <div className="text-gray-400 text-sm mt-10">
              Nothing borrowed yet
            </div>
          </div>
          <div
            className="p-6 border border-gray-700 rounded-sm"
            style={{ backgroundColor: "var(--container)" }}
          >
            <h3 className="font-bold text-lg">Your borrows</h3>
            <div className="text-gray-400 text-sm mt-10">
              Nothing to borrow yet
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
