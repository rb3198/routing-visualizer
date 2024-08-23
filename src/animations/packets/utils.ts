import { Point2D, RectDim } from "../../types/geometry";
import { getSlopeAngleDist2D } from "../../utils/drawing";
import {
  getAllRectPointsFromCentroid,
  getTravelDirection,
} from "../../utils/geometry";

export const packetAnimationUtils = {
  getEndpointCoords: function (cellSize: number, location: Point2D): Point2D {
    const [x, y] = location;
    return [x * cellSize + cellSize / 2, y * cellSize + cellSize / 2];
  },
  getCheckpointCoords: function (
    cellSize: number,
    origin: Point2D,
    dest: Point2D
  ): { cp1: Point2D; cp2: Point2D } {
    const [orX, orY] = origin;
    const [destX, destY] = dest;
    let cp1: Point2D, cp2: Point2D;
    if (destX === orX) {
      const x = cellSize * (orX + 1 / 2);
      if (destY > orY) {
        cp1 = [x, cellSize * (orY + 1)];
        cp2 = [x, cellSize * destY];
      } else {
        cp1 = [x, cellSize * orY];
        cp2 = [x, cellSize * (destY + 1)];
      }
    } else {
      if (destX > orX) {
        cp1 = [cellSize * (orX + 1), cellSize * (orY + 1 / 2)];
        cp2 = [cellSize * destX, cellSize * (destY + 1 / 2)];
      } else {
        cp1 = [cellSize * orX, cellSize * (orY + 1 / 2)];
        cp2 = [cellSize * (destX + 1), cellSize * (destY + 1 / 2)];
      }
    }
    return { cp1, cp2 };
  },
  drawPacket: function (
    context: CanvasRenderingContext2D,
    from: Point2D,
    to: Point2D,
    startTime: number,
    totalTime: number,
    packetDim: RectDim,
    color: string
  ): Point2D {
    const { w: rectW, h: rectH } = packetDim;
    const [aX, aY] = from;
    const { directionX, directionY } = getTravelDirection(from, to);
    const { slope, distance: totalDistance } = getSlopeAngleDist2D(from, to);
    const v = totalDistance / totalTime;
    const time = Date.now() - startTime;
    const distance = v * time;
    const x =
      aX +
      distance *
        Math.sqrt(1 / (slope ** 2 + 1)) *
        (directionX === "left" ? -1 : 1);
    const y =
      Math.abs(slope) === Infinity
        ? aY + distance * (directionY === "top" ? -1 : 1)
        : aY +
          distance *
            Math.abs(slope) *
            Math.sqrt(1 / (slope ** 2 + 1)) *
            (directionY === "top" ? -1 : 1);
    if (!context) {
      return [x, y];
    }
    const { p1: low } = getAllRectPointsFromCentroid([x, y], rectW, rectH);
    context.save();
    context.fillStyle = color;
    context.beginPath();
    context.rect(...low, rectW, rectH);
    context.fill();
    context.closePath();
    context.restore();
    return [x, y];
  },
};
