// Public configuration; no credentials belong in this file.
export const site = {
  origin: "https://yuto-matsui.com",
  japaneseUrl: "https://yuto-matsui.com/",
  englishUrl: "https://yuto-matsui.com/en/",
  compassOrigin: "https://compass-official.pages.dev",
  gaMeasurementId: "G-EHKJ8B8N0Y"
} as const;

export const FOUNDER_URL = site.japaneseUrl;
export const FOUNDER_EN_URL = site.englishUrl;
export const COMPASS_ORIGIN = site.compassOrigin;
export const COMPASS_PARENT_GA_MEASUREMENT_ID = site.gaMeasurementId;
