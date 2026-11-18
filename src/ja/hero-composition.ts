// JP second portrait (Yokohama, camera). Measured on the 1333 × 2000 master
// (graded only, never cropped): the torso sits right of the photo's centre, so the
// frame zooms just enough to put the torso on the vertical centre line.
// Keeping source pixels makes the framing independent of screen size.
export const cameraPortraitAnchors = {
  sourceWidth: 1333, sourceHeight: 2000,
  torsoX: 770, headY: 620, chinY: 1030
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
