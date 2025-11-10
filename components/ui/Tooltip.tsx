import { Tooltip as MuiTooltip } from "@mui/material";

export default function Tooltip({ text, styles }: { text: string, styles?: string }) {
  return (
    <MuiTooltip title={text} placement="top">
      <span
        aria-hidden
        className={styles + " cursor-default inline-flex h-3 w-3 items-center justify-center rounded-full border border-slate-500 text-[10px] leading-none text-slate-400 hover:text-[#29b6f6] hover:border-[#29b6f6]"}
      >
        i
      </span>
    </MuiTooltip>
  );
}
