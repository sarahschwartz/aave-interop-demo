import StyledToggleGroup from "@/components/ui/StyledToggleGroup";
import StyledToggleButton from "@/components/ui/StyledToggleButton";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Dispatch, SetStateAction, useState } from "react";
import AssetsToSupply from "./supply/AssetsToSupply";
import type { ViemSdk, ViemClient } from "@dutterbutter/zksync-sdk/viem";
import { SuppliedAssets } from "./supply/SuppliedAssets";
import { UseAccountReturnType, Config } from "wagmi";
import AssetsToBorrow from "./borrow/AssetsToBorrow";
import { AaveData } from "@/utils/types";

interface Props {
  sdk?: ViemSdk;
  client?: ViemClient;
  isLoading: boolean;
  finalizingDeposits: number;
  ethBalance: string;
  setUpdateCount: Dispatch<SetStateAction<number>>;
  updateCount: number;
  ethPrice: number;
  usdValue: number;
  account: UseAccountReturnType<Config>;
  aaveData?: AaveData;
  healthFactor?: number;
}

export default function SupplyAndBorrow({
  sdk,
  client,
  isLoading,
  finalizingDeposits,
  ethBalance,
  setUpdateCount,
  updateCount,
  ethPrice,
  usdValue,
  account,
  aaveData,
  healthFactor
}: Props) {
  const [mode, setMode] = useState<"supply" | "borrow" | "">("supply");
  const [assetsToSupplyCollapsed, setAssetsToSupplyCollapsed] =
    useState<boolean>(false);
  const [suppliedAssetsCollapsed, setSuppliedAssetsCollapsed] =
    useState<boolean>(false);
  const [assetsToBorrowCollapsed, setAssetsToBorrowCollapsed] =
    useState<boolean>(false);
  const [borrowedAssetsCollapsed, setBorrowedAssetsCollapsed] =
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
      fontSize: "14px",
      color: "#a5a8b6",
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
            <div className="flex justify-between">
              <h3 className="font-bold text-lg">Your supplies</h3>
              {ethBalance && (
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
            <div className="flex justify-between">
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
                client={client}
                setUpdateCount={setUpdateCount}
                updateCount={updateCount}
                ethPrice={ethPrice}
                isLoading={isLoading}
                account={account}
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
            <div className="flex justify-between">
              <h3 className="font-bold text-lg">Assets to borrow</h3>
              <Box
                sx={() => collapseStyles(assetsToBorrowCollapsed)}
                onClick={() =>
                  setAssetsToBorrowCollapsed(!assetsToBorrowCollapsed)
                }
              >
                {assetsToBorrowCollapsed ? <div>Show</div> : <div>Hide</div>}
                <span />
              </Box>
            </div>
            {!assetsToBorrowCollapsed && (
              <div className="text-gray-400 text-sm mt-10">
                Nothing borrowed yet
              </div>
            )}
          </div>
          <div
            className="p-6 border border-gray-700 rounded-sm"
            style={{ backgroundColor: "var(--container)" }}
          >
            <div className="flex justify-between">
              <h3 className="font-bold text-lg">Your borrows</h3>
              <Box
                sx={() => collapseStyles(borrowedAssetsCollapsed)}
                onClick={() =>
                  setBorrowedAssetsCollapsed(!borrowedAssetsCollapsed)
                }
              >
                {borrowedAssetsCollapsed ? <div>Show</div> : <div>Hide</div>}
                <span />
              </Box>
            </div>
            {!borrowedAssetsCollapsed && (
              <AssetsToBorrow
                sdk={sdk}
                client={client}
                setUpdateCount={setUpdateCount}
                isLoading={isLoading}
                account={account}
                aaveData={aaveData}
                healthFactor={healthFactor}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
