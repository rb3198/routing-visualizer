import { Rect } from "../entities/Rect";

export const drawRouterBox = function (
  this: Rect,
  context: CanvasRenderingContext2D
) {
  const { x, y, width, height } = this;
  const hStart = 0.1 * width,
    yStart = 0.55 * height;
  const length = 0.8 * width,
    breadth = 0.3 * height;
  const arcRadius = 0.1 * width;
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
  this: Rect,
  context: CanvasRenderingContext2D
) {
  const { x, y, width, height } = this;
  context.moveTo(x + 0.7 * width, y + 0.2 * height);
  context.lineTo(x + 0.7 * width, y + 0.55 * height);
  context.moveTo(x + 0.325 * width, y + 0.3 * height);
  context.lineTo(x + 0.325 * width, y + 0.55 * height);
};

export const drawRouterButtons = function (
  this: Rect,
  context: CanvasRenderingContext2D
) {
  const { x, y, width, height } = this;
  const r = 0.015 * width;
  context.moveTo(x + 0.2 * width, y + 0.7 * height);
  context.arc(x + 0.25 * width, y + 0.7 * height, r, 0, 2 * Math.PI);
  context.moveTo(x + 0.4 * width, y + 0.7 * height);
  context.arc(x + 0.4 * width, y + 0.7 * height, r, 0, 2 * Math.PI);
};
