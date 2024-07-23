import { Point, Rect } from "../types/geometry";

export const getRectCentroid = (boundingBox: Rect): Point => {
  const { p1, p3 } = boundingBox;
  const [x1, y1] = p1;
  const [x2, y2] = p3;
  return [(x1 + x2) / 2, (y1 + y2) / 2];
};
