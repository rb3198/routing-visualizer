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

/**
 * Gets the Euclidean distance between two given points
 * @param p1
 * @param p2
 * @returns
 */
export const getEuclideanDistance = (p1: Point2D, p2: Point2D) =>
  Math.sqrt((p2[1] - p1[1]) ** 2 + (p2[0] - p1[0]) ** 2);

/**
 * This method figures the direction of the travel along the X and Y axes
 * when some entity travels by starting at point `start` with point
 * `end` as the destination.
 * @param start
 * @param end
 */
export const getTravelDirection = (start: Point2D, end: Point2D) => {
  const [startX, startY] = start;
  const [endX, endY] = end;
  const directionX =
    endX === startX ? "none" : endX < startX ? "left" : "right";
  const directionY =
    endY === startY ? "none" : endY < startY ? "top" : "bottom";
  return { directionX, directionY };
};

export const vmax = (units: number) => {
  const { innerWidth, innerHeight } = window;
  return (units * Math.max(innerWidth, innerHeight)) / 100;
};

/**
 * Vector subtraction of `p1` from `p2`
 * @param p1
 * @param p2
 * @returns
 */
export const subtractVectors = (p1: Point2D, p2: Point2D): Point2D => {
  const [p1x, p1y] = p1;
  const [p2x, p2y] = p2;
  return [p2x - p1x, p2y - p1y];
};

/**
 * Vector addition of `p1` and `p2`
 * @param p1
 * @param p2
 * @returns
 */
export const addVectors = (p1: Point2D, p2: Point2D): Point2D => {
  const [p1x, p1y] = p1;
  const [p2x, p2y] = p2;
  return [p1x + p2x, p2y + p1y];
};
