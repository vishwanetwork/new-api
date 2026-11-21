import type { AriaAttributes } from "react";
import "./new-provider-marks.css";

type MarkProps = AriaAttributes & { size?: number; focusable?: boolean | "false" | "true" };

export function SeedanceMark({ size = 24, "aria-hidden": hidden }: MarkProps) {
  return (
    <img
      src="./provider-logos/bytedance-seed-mark.ico"
      width={size}
      height={size}
      alt={hidden ? "" : "ByteDance Seed"}
      aria-hidden={hidden}
      className="np-seedance-mark"
    />
  );
}

export function MiniMaxMark({ size = 24, "aria-hidden": hidden }: MarkProps) {
  return (
    <img
      src="./provider-logos/minimax-mark.ico"
      width={size}
      height={size}
      alt={hidden ? "" : "MiniMax"}
      aria-hidden={hidden}
      className="np-minimax-mark"
    />
  );
}

export function KimiMark({ size = 24, "aria-hidden": hidden }: MarkProps) {
  return (
    <img
      src="./provider-logos/kimi-mark.png"
      width={size}
      height={size}
      alt={hidden ? "" : "Kimi"}
      aria-hidden={hidden}
      className="np-kimi-mark"
    />
  );
}
