import { cn } from "@/lib/cn";

/** ~iPhone 15 Pro frame ratio (width : height) for max-size fit in container */
const PHONE_W = 393;
const PHONE_H = 852;

interface IPhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

export function IPhoneMockup({ children, className }: IPhoneMockupProps) {
  return (
    <div
      className={cn(
        "flex max-h-full max-w-full items-center justify-center",
        className,
      )}
    >
      <div
        className="flex max-h-full max-w-full flex-col overflow-hidden rounded-[3rem] border-[3px] border-neutral-700 bg-black shadow-[0_0_60px_rgba(255,255,255,0.03)]"
        style={{
          aspectRatio: `${PHONE_W} / ${PHONE_H}`,
          width: `min(100cqw, calc(100cqh * ${PHONE_W} / ${PHONE_H}))`,
          height: `min(100cqh, calc(100cqw * ${PHONE_H} / ${PHONE_W}))`,
        }}
      >
        {/* Dynamic Island */}
        <div className="relative z-10 flex shrink-0 justify-center bg-black pb-1 pt-3">
          <div className="h-[28px] w-[100px] rounded-full border border-neutral-800 bg-black" />
        </div>

        {/* Screen — child (recipe preview) scrolls with hidden scrollbar */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0c0c0c]">
          {children}
        </div>

        {/* Home indicator */}
        <div className="flex shrink-0 justify-center bg-black pb-3 pt-2">
          <div className="h-[5px] w-[120px] rounded-full bg-neutral-700" />
        </div>
      </div>
    </div>
  );
}
