import { Point2D } from "../types/geometry";

/**
 * Gets all 4 points of a rect from its `low` and `high` points.
 *
 * Based on inverted axis, as per JS Norms.
 * @param low
 * @param high
 */
export const getAllRectPoints = (
  low: Point2D,
  high: Point2D
): {
  /**
   * Lowest (Top left) point of the rect
   *
   */
  p1: Point2D;
  /**
   * Top right point of the rect
   *
   */
  p2: Point2D;
  /**
   * Highest (Bottom right) point of the rect
   *
   */
  p3: Point2D;
  /**
   * Bottom left point of the rect
   *
   */
  p4: Point2D;
} => {
  const [lowX, lowY] = low;
  const [highX, highY] = high;
  const p1: Point2D = low;
  const p2: Point2D = [highX, lowY];
  const p3: Point2D = high;
  const p4: Point2D = [lowX, highY];
  return { p1, p2, p3, p4 };
};

export const getAllRectPointsFromCentroid = (
  centroid: Point2D,
  length: number,
  breadth: number
) => {
  const [x, y] = centroid;
  const lowX = x - length / 2,
    lowY = y - breadth / 2,
    highX = x + length / 2,
    highY = y + breadth / 2;
  const p1: Point2D = [lowX, lowY];
  const p2: Point2D = [highX, lowY];
  const p3: Point2D = [highX, highY];
  const p4: Point2D = [lowX, highY];
  return { p1, p2, p3, p4 };
};
