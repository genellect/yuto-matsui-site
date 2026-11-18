// Portrait framing for the EN hero. Instead of one fixed object-position, each
// photograph names where the eyes and the top of the head are, and the crop is
// worked out for the frame it has to fill: the eyes sit near a fixed line from
// the top and the head keeps room above it, whatever the screen's proportions.
// On mobile the copy sits under the portrait, so the crop may move in a little
// (up to MAX_ZOOM) to keep the face clear of it.

export type Focus = {
  /** Horizontal centre of the face, 0–1 from the left of the photograph. */
  x: number;
  /** Eye line, 0–1 from the top of the photograph. */
  y: number;
  /** Top of the head, 0–1 from the top of the photograph. */
  head: number;
};

export type Framing = {
  /** Visible part of the photograph, as fractions of its width and height. */
  width: number;
  height: number;
  /** Visible part's offset from the photograph's left and top edges. */
  left: number;
  top: number;
  /** The same crop for the HTML image: cover, then scale about an origin. */
  objectPosition: string;
  zoom: number;
  origin: string;
};

const MAX_ZOOM = 1;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function frame(focus: Focus, image: readonly [number, number], box: readonly [number, number], mobile: boolean): Framing {
  const imageAspect = image[0] / image[1];
  const boxAspect = box[0] / Math.max(1, box[1]);
  const coverWidth = Math.min(1, boxAspect / imageAspect);
  const coverHeight = Math.min(1, imageAspect / boxAspect);
  const eyeLine = mobile ? 0.36 : 0.38;
  const faceLine = mobile ? 0.5 : 0.46;
  const headroom = 0.07;
  // The least zoom that lets the eyes reach the eye line without showing past
  // the photograph's edges.
  const zoom = mobile
    ? clamp(Math.max(1, ((1 - eyeLine) * coverHeight) / (1 - focus.y), (eyeLine * coverHeight) / focus.y), 1, MAX_ZOOM)
    : 1;
  const width = coverWidth / zoom;
  const height = coverHeight / zoom;
  let top = clamp(focus.y - eyeLine * height, 0, 1 - height);
  if (focus.head - top < headroom * height) top = clamp(focus.head - headroom * height, 0, 1 - height);
  const left = clamp(focus.x - faceLine * width, 0, 1 - width);

  // HTML image: object-fit: cover places a window around the crop, then a
  // scale about `origin` narrows it to exactly the crop.
  const coverLeft = clamp(left - (coverWidth - width) / 2, 0, 1 - coverWidth);
  const coverTop = clamp(top - (coverHeight - height) / 2, 0, 1 - coverHeight);
  const percent = (offset: number, visible: number) => (visible >= 1 ? 50 : (offset / (1 - visible)) * 100);
  const originOf = (offset: number, coverOffset: number, cover: number) =>
    zoom > 1 ? ((offset - coverOffset) / cover / (1 - 1 / zoom)) * 100 : 50;
  return {
    width, height, left, top, zoom,
    objectPosition: `${percent(coverLeft, coverWidth).toFixed(1)}% ${percent(coverTop, coverHeight).toFixed(1)}%`,
    origin: `${originOf(left, coverLeft, coverWidth).toFixed(1)}% ${originOf(top, coverTop, coverHeight).toFixed(1)}%`
  };
}
