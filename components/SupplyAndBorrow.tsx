import StyledToggleGroup from "@/components/ui/StyledToggleGroup";
import StyledToggleButton from "@/components/ui/StyledToggleButton";
import { Typography, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";

export default function SupplyAndBorrow() {
  const [mode, setMode] = useState<"supply" | "borrow" | "">("supply");
  const { breakpoints } = useTheme();
  const isDesktop = useMediaQuery(breakpoints.up("lg"));

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
              <div className="font-bold text-sm">Supply</div>
            </Typography>
          </StyledToggleButton>
          <StyledToggleButton value="borrow" disabled={mode === "borrow"}>
            <Typography sx={{ textTransform: "none" }}>
              <div className="font-bold text-sm">Borrow</div>
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
            <div className="text-gray-400 text-sm mt-10">
              Nothing to supply yet
            </div>
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
