"use client";

import { controls as jaControls } from "../content/ja";
import { useState, type ReactNode } from "react";

type EssayContinuationProps = {
  children: ReactNode;
  className: string;
  buttonClassName: string;
  contentClassName: string;
};

export function EssayContinuation({
  children,
  className,
  buttonClassName,
  contentClassName
}: EssayContinuationProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className}>
      <button
        type="button"
        className={buttonClassName}
        aria-expanded={expanded}
        aria-controls="founder-essay-continuation"
        onClick={() => setExpanded((current) => !current)}
      >
        <span>{expanded ? jaControls.closeEssay : jaControls.readEssay}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {expanded ? (
        <div id="founder-essay-continuation" className={contentClassName}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
