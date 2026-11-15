"use client";

import type { AnchorHTMLAttributes } from "react";

type FounderJapaneseLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export function FounderJapaneseLink({ children, ...props }: FounderJapaneseLinkProps) {
  return <a {...props} href="/">{children}</a>;
}
