"use client";

import { useEffect, useState } from "react";

export type FragmentView = "3d" | "original";

// Phones (≤700px) open the photo section with the original photographs; wider screens open in 3D.
// Once the visitor picks a view, that choice holds at every width.
// The page is pre-rendered before the width is known, so the phone default is also exposed as
// `mobileView` for the ≤700px CSS, which then shows the photographs from the first paint.
export function useFragmentView() {
  const [choice, setChoice] = useState<FragmentView | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = matchMedia("(max-width: 700px)");
    const update = () => setMobile(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return {
    view: choice ?? (mobile ? "original" : "3d"),
    mobileView: choice ?? "original",
    mobile,
    choose: setChoice
  };
}
