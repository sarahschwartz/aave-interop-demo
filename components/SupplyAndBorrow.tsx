/* eslint-disable @typescript-eslint/no-explicit-any */
import StyledToggleGroup from "@/components/ui/StyledToggleGroup";
import StyledToggleButton from "@/components/ui/StyledToggleButton";
import { Typography, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import AssetsToSupply from "./AssetsToSupply";
import { zksyncOSTestnet } from "@/utils/wagmi";
import { createViemClient, createViemSdk, ViemSdk } from "@dutterbutter/zksync-sdk/viem";
import { EIP1193Provider, custom, createWalletClient, createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { UseAccountReturnType, Config } from "wagmi";

export default function SupplyAndBorrow({ account }: { account: UseAccountReturnType<Config>}) {
  const [mode, setMode] = useState<"supply" | "borrow" | "">("supply");
   const [sdk, setSdk] = useState<ViemSdk>();
  const { breakpoints } = useTheme();
  const isDesktop = useMediaQuery(breakpoints.up("lg"));

    const DEFAULT_L1_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
  const DEFAULT_L2_RPC = "https://zksync-os-testnet-alpha.zksync.dev/";

  const l1Client = createPublicClient({
    chain: sepolia,
    transport: http(DEFAULT_L1_RPC),
  });

    const instantiateSdk = useCallback(
      async (addr: `0x${string}`, prov: EIP1193Provider, rpc: string) => {
        const transport = custom(prov);
  
        const l1Wallet = createWalletClient({
          account: addr,
          chain: sepolia,
          transport,
        });
  
        const l2Public = createPublicClient({
          chain: zksyncOSTestnet,
          transport: http(rpc),
        });
  
        const l2Wallet = createWalletClient({
          account: addr,
          chain: zksyncOSTestnet,
          transport,
        });
  
        const client = createViemClient({
          l1: l1Client as any,
          l2: l2Public as any,
          l1Wallet: l1Wallet as any,
          l2Wallet: l2Wallet as any,
        } as any);
  
        const instance = createViemSdk(client);
        return instance;
      },
      []
    );
  
    useEffect(() => {
        async function setup() {
          if (!account || !account.connector || !account.connector.getProvider)
            return;
          const provider = (await account.connector.getProvider()) as
            | EIP1193Provider
            | undefined;
          if (!provider) {
            alert("No injected wallet found. Connect your wallet again.");
            return;
          }
          const instance = await instantiateSdk(
            account.address!,
            provider,
            DEFAULT_L2_RPC
          );
          setSdk(instance);
        }
    
        setup();
      }, [account]);

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
        <div className={isDesktop || mode === 'supply' ? 'flex gap-4 flex-col w-full' : 'hidden'}>
          <div
            className="w-full p-6 border border-gray-700 rounded-sm"
            style={{ backgroundColor: "var(--container)" }}
          >
            <h3 className="font-bold text-lg">Your supplies</h3>
            <div className="text-gray-400 text-sm mt-10">
              Nothing supplied yet
            </div>
          </div>

          <div
            className="w-full p-6 border border-gray-700 rounded-sm"
            style={{ backgroundColor: "var(--container)" }}
          >
            <h3 className="font-bold text-lg">Assets to supply</h3>
           <AssetsToSupply sdk={sdk} />
          </div>
        </div>

        {/* BORROW */}
        <div className={isDesktop || mode === 'borrow' ? 'flex gap-4 flex-col w-full' : 'hidden'}>
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
