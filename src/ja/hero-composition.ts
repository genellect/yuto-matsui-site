// Measured on the unmodified 1600 × 2400 lake master. Keeping source pixels
// makes the framing independent of screen size and of slide transition motion.
export const lakePortraitAnchors = {
  sourceWidth: 1600, sourceHeight: 2400,
  noseX: 785, headY: 1048, thighY: 1880,
  leftElbowX: 550, rightElbowX: 1008, handsY: 1494
} as const;

export function lakePortraitComposition(width: number, height: number) {
  const a = lakePortraitAnchors;
  const composed = height * .8 / (a.thighY - a.headY);
  const elbowLimit = width * .44 / Math.max(a.noseX - a.leftElbowX, a.rightElbowX - a.noseX);
  const cover = Math.max(width / a.sourceWidth, height / a.sourceHeight);
  const scale = Math.max(cover, Math.min(composed, elbowLimit));
  const imageWidth = a.sourceWidth * scale;
  const imageHeight = a.sourceHeight * scale;
  return {
    width: imageWidth, height: imageHeight,
    left: Math.max(width - imageWidth, Math.min(0, width * .5 - a.noseX * scale)),
    top: Math.max(height - imageHeight, Math.min(0, height * .2 - a.headY * scale))
  };
}

// Trial second portrait (Yokohama, camera). Measured on the unmodified
// 1333 × 2000 master: the torso sits right of the photo's centre, so the
// frame zooms just enough to put the torso on the vertical centre line.
export const cameraPortraitAnchors = {
  sourceWidth: 1333, sourceHeight: 2000,
  torsoX: 790, headY: 692, chinY: 1100
} as const;

export function cameraPortraitComposition(width: number, height: number) {
  const a = cameraPortraitAnchors;
  const cover = Math.max(width / a.sourceWidth, height / a.sourceHeight);
  const centred = width / (2 * Math.min(a.torsoX, a.sourceWidth - a.torsoX));
  const scale = Math.max(cover, centred);
  const imageWidth = a.sourceWidth * scale;
  const imageHeight = a.sourceHeight * scale;
  return {
    width: imageWidth, height: imageHeight,
    left: Math.max(width - imageWidth, Math.min(0, width * .5 - a.torsoX * scale)),
    top: Math.max(height - imageHeight, Math.min(0, height * .18 - a.headY * scale))
  };
}

// Trial Mobile-only second portrait (bus stop, landscape 2000 × 1333).
// He faces left, so his head sits right of centre and the gaze keeps room.
export const busStopPortraitAnchors = {
  sourceWidth: 2000, sourceHeight: 1333,
  headX: 1250, headTopY: 580, chinY: 750, seatY: 1230
} as const;

export function busStopPortraitComposition(width: number, height: number) {
  const a = busStopPortraitAnchors;
  const cover = Math.max(width / a.sourceWidth, height / a.sourceHeight);
  const framed = height * .8 / (a.seatY - a.headTopY);
  const scale = Math.max(cover, framed);
  const imageWidth = a.sourceWidth * scale;
  const imageHeight = a.sourceHeight * scale;
  return {
    width: imageWidth, height: imageHeight,
    left: Math.max(width - imageWidth, Math.min(0, width * .62 - a.headX * scale)),
    top: Math.max(height - imageHeight, Math.min(0, height * .2 - a.headTopY * scale))
  };
}
