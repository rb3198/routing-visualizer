import { Point2D, RectDim } from "../../types/geometry";
import { beforeDraw, getSlopeAngleDist2D, postDraw } from "../../utils/drawing";
import {
  getAllRectPointsFromCentroid,
  getTravelDirection,
} from "../../utils/geometry";

export const packetAnimationUtils = {
  getEndpointCoords: function (cellSize: number, location: Point2D): Point2D {
    const [x, y] = location;
    return [x + cellSize / 2, y + cellSize / 2];
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
      const x = orX + cellSize / 2;
      if (destY > orY) {
        cp1 = [x, orY + cellSize];
        cp2 = [x, destY];
      } else {
        cp1 = [x, orY];
        cp2 = [x, destY + cellSize];
      }
    } else {
      if (destX > orX) {
        cp1 = [orX + cellSize, orY + cellSize / 2];
        cp2 = [destX, destY + cellSize / 2];
      } else {
        cp1 = [orX, orY + cellSize / 2];
        cp2 = [destX + cellSize, destY + cellSize / 2];
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
    beforeDraw(context);
    context.fillStyle = color;
    context.beginPath();
    context.rect(...low, rectW, rectH);
    context.fill();
    context.closePath();
    postDraw(context);
    return [x, y];
  },
};
