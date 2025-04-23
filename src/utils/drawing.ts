import { DEFAULT_CELL_SIZE } from "src/constants/sizing";
import { Point2D, RectDim } from "../types/geometry";
import { getTravelDirection } from "./geometry";
import { Router } from "src/entities/router";

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
  let [startX, startY] = start,
    [endX, endY] = end;
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
  const { zoom = 1, canvasOffset = [0, 0] } = window;
  ctx.save();
  ctx.scale(1 / zoom, 1 / zoom);
  ctx.translate(...canvasOffset);
};

export const postDraw = (ctx: CanvasRenderingContext2D) => {
  ctx.restore();
};

export const clearCanvas = (canvas?: HTMLCanvasElement | null) => {
  if (!canvas) {
    return;
  }
  const { width, height } = canvas.getBoundingClientRect();
  const ctx = canvas.getContext("2d");
  ctx?.clearRect(0, 0, width, height);
};

export const getCellSize = () => window.cellSize ?? DEFAULT_CELL_SIZE;

export const drawRouterBox = function (
  this: Router,
  context: CanvasRenderingContext2D
) {
  const [x, y] = this.location;
  const size = getCellSize();
  const hStart = 0.1 * size,
    yStart = 0.55 * size;
  const length = 0.8 * size,
    breadth = 0.3 * size;
  const arcRadius = 0.1 * size;
  const y1 = y + yStart;
  const y2 = y + (yStart + breadth);
  const p1 = [x + hStart, y1];
  const p2 = [x + hStart + length, y1];
  const p3 = [x + hStart + length, y2];
  const p4 = [x + hStart, y2];
  context.moveTo(p1[0] + arcRadius, p1[1]);
  context.lineTo(p2[0] - arcRadius, p2[1]);
  context.arcTo(p2[0], p2[1], p2[0], p2[1] + arcRadius, arcRadius);
  context.lineTo(p3[0], p3[1] - arcRadius);
  context.arcTo(p3[0], p3[1], p3[0] - arcRadius, p3[1], arcRadius);
  context.lineTo(p4[0] + arcRadius, p4[1]);
  context.arcTo(p4[0], p4[1], p4[0], p4[1] - arcRadius, arcRadius);
  context.lineTo(p4[0], p4[1] - arcRadius);
  context.arcTo(p1[0], p1[1], p1[0] + arcRadius, p1[1], arcRadius);
};

export const drawRouterAntennas = function (
  this: Router,
  context: CanvasRenderingContext2D
) {
  const [x, y] = this.location;
  const size = getCellSize();
  context.moveTo(x + 0.7 * size, y + 0.2 * size);
  context.lineTo(x + 0.7 * size, y + 0.55 * size);
  context.moveTo(x + 0.325 * size, y + 0.3 * size);
  context.lineTo(x + 0.325 * size, y + 0.55 * size);
};

export const drawRouterButtons = function (
  this: Router,
  context: CanvasRenderingContext2D
) {
  const [x, y] = this.location;
  const size = getCellSize();
  const r = 0.015 * size;
  context.moveTo(x + 0.2 * size, y + 0.7 * size);
  context.arc(x + 0.25 * size, y + 0.7 * size, r, 0, 2 * Math.PI);
  context.moveTo(x + 0.4 * size, y + 0.7 * size);
  context.arc(x + 0.4 * size, y + 0.7 * size, r, 0, 2 * Math.PI);
};
