import { Point2D } from "../types/geometry";

export const getSlopeAngleDist2D = (p1: Point2D, p2: Point2D) => {
  const [aX, aY] = p1;
  const [bX, bY] = p2;
  const slope = (bY - aY) / (bX - aX);
  const theta = Math.atan(slope);
  const distance = Math.sqrt((bX - aX) ** 2 + (bY - aY) ** 2);
  return { slope, theta, distance };
};

export const getLinkInterfaceCoords = (
  p1: Point2D,
  p2: Point2D,
  theta: number,
  cellSize: number
) => {
  const [aX, aY] = p1,
    [bX, bY] = p2;
  let startX = aX * cellSize + cellSize / 2,
    startY = aY * cellSize,
    endX = bX * cellSize + cellSize / 2,
    endY = (bY + 1) * cellSize;
  if (theta === Math.PI / 2) {
    startY = (aY + 1) * cellSize;
    endY = bY * cellSize;
  } else if (theta !== -Math.PI / 2) {
    startX = (aX > bX ? aX : aX + 1) * cellSize;
    startY = aY * cellSize + cellSize / 2;
    endX = (aX > bX ? bX + 1 : bX) * cellSize;
    endY = bY * cellSize + cellSize / 2;
  }
  return { startX, startY, endX, endY };
};
