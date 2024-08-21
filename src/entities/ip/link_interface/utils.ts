import { IPLinkInterface } from ".";
import { Point2D } from "../../../types/geometry";
import { getSlopeAngleDist2D } from "../../../utils/drawing";
import { getAllRectPointsFromCentroid } from "../../../utils/geometry";

export const packetAnimationUtils = {
  getEndpointCoords: function (
    this: IPLinkInterface,
    location: Point2D
  ): Point2D {
    const { gridCellSize: cellSize } = this;
    const [x, y] = location;
    return [x * cellSize + cellSize / 2, y * cellSize + cellSize / 2];
  },
  getCheckpointCoords: function (
    this: IPLinkInterface,
    origin: Point2D,
    dest: Point2D
  ): { cp1: Point2D; cp2: Point2D } {
    const { gridCellSize: cellSize } = this;
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
    this: IPLinkInterface,
    from: Point2D,
    to: Point2D,
    startTime: number,
    totalTime: number,
    packetDim: { rectH: number; rectW: number },
    color: string
  ): Point2D {
    const { rectW, rectH } = packetDim;
    const context = this.elementLayerContext;
    const [aX, aY] = from;
    const [bX, bY] = to;
    const directionX = bX === aX ? "none" : bX < aX ? "left" : "right";
    const directionY = bY === aY ? "none" : bY < aY ? "top" : "bottom";
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
