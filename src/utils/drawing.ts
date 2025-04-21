import { Point2D, RectDim } from "../types/geometry";
import { getTravelDirection } from "./geometry";

export const getSlopeAngleDist2D = (p1: Point2D, p2: Point2D) => {
  const [aX, aY] = p1;
  const [bX, bY] = p2;
  const slope = (bY - aY) / (bX - aX);
  const theta = Math.atan(slope);
  const distance = Math.sqrt((bX - aX) ** 2 + (bY - aY) ** 2);
  return { slope, theta, distance };
};

export const getLinkInterfaceCoords = (
  cellSize: number,
  start: Point2D,
  end: Point2D,
  shift?: boolean
) => {
  let { directionX, directionY } = getTravelDirection(start, end);
  let [startX, startY] = start.map((u) => u * cellSize),
    [endX, endY] = end.map((u) => u * cellSize);
  startY += cellSize / 2;
  endY += cellSize / 2;
  if (directionX === "right") {
    startX += cellSize;
  } else if (directionX === "left") {
    endX += cellSize;
  }
  const { directionX: x, directionY: y } = getTravelDirection(
    [startX, startY],
    [endX, endY]
  );
  const changed = x !== directionX;
  directionX = x;
  directionY = y;
  const { theta, distance: totalDistance } = getSlopeAngleDist2D(
    [startX, startY],
    [endX, endY]
  );
  const m = Math.tan(theta);
  const norm = Math.sqrt(1 + m ** 2);
  let startThetaOffset = 0,
    endThetaOffset = 0;
  const distOffset = 0.1;
  if (!shift) {
    return {
      startX,
      startY,
      endX,
      endY,
      directionX,
      directionY,
      startThetaOffset,
      endThetaOffset,
      theta,
    };
  }
  if (directionX === "none") {
    const distance = distOffset * totalDistance;
    startX += changed ? 0 : cellSize / 2;
    endX += changed ? 0 : cellSize / 2;
    if (directionY === "bottom") {
      endThetaOffset = Math.PI;
    } else {
      endThetaOffset = Math.PI;
    }
    startY +=
      directionY === "bottom"
        ? cellSize / 2 + distance
        : -cellSize / 2 - distance;
    endY +=
      directionY === "bottom"
        ? -cellSize / 2 - distance
        : cellSize / 2 + distance;
  } else if (directionX === "left") {
    startX -= (distOffset * totalDistance) / norm;
    startY -= (distOffset * totalDistance * m) / norm;
    endX += (distOffset * totalDistance) / norm;
    endY += (distOffset * totalDistance * m) / norm;
    startThetaOffset = Math.PI;
  } else {
    startX += (distOffset * totalDistance) / norm;
    startY += (distOffset * totalDistance * m) / norm;
    endX -= (distOffset * totalDistance) / norm;
    endY -= (distOffset * totalDistance * m) / norm;
    endThetaOffset = Math.PI;
  }

  return {
    startX,
    startY,
    directionX,
    directionY,
    endX,
    endY,
    startThetaOffset,
    endThetaOffset,
    theta,
  };
};

/**
 * Given the cell size of the grid, configures the packet's rect dimensions
 * @param cellSize
 */
export const getDefaultPacketRect = (cellSize: number): RectDim => {
  return { w: cellSize / 2, h: cellSize / 3.5 };
};

/**
 * Given a textual label, returns its height & width given the Canvas Context with font style.
 * @param ctx
 * @param text
 */
export const getTextDimensions = (
  ctx: CanvasRenderingContext2D,
  text: string
) => {
  const { actualBoundingBoxAscent, actualBoundingBoxDescent, width } =
    ctx.measureText(text);
  return { height: actualBoundingBoxAscent + actualBoundingBoxDescent, width };
};

export const beforeDraw = (ctx: CanvasRenderingContext2D) => {
  const { zoom = 1 } = window;
  ctx.save();
  ctx.scale(1 / zoom, 1 / zoom);
};

export const postDraw = (ctx: CanvasRenderingContext2D) => {
  ctx.restore();
};
