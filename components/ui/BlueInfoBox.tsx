import { ReactNode } from "react";

export function BlueInfoBox({ text, children }: { text?: string, children?: ReactNode}){
    return (
            <div>
          <div className="flex gap-4 items-center bg-[#071f2e] px-4 py-2 rounded-sm mt-6">
            <span
              aria-hidden
              className={
                "shrink-0 cursor-default inline-flex h-4 w-4 items-center justify-center rounded-full border-2 font-bold text-[12px] leading-none text-[#29b6f6] border-[#29b6f6]"
              }
            >
              i
            </span>
            <div className="text-[12px] text-[#a9e2fb]">
              {text}
              {children}
            </div>
          </div>
        </div>
    )
}