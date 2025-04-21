import { Router } from "../../entities/router";
import { Point2D, RectDim } from "../../types/geometry";
import {
  beforeDraw,
  getDefaultPacketRect,
  postDraw,
} from "../../utils/drawing";
import {
  getAllRectPointsFromCentroid,
  getEuclideanDistance,
  getTravelDirection,
} from "../../utils/geometry";
import { packetAnimationUtils } from "./utils";

const nextPacketStatus = new Map<
  "start" | "cp1" | "cp2" | "end",
  "start" | "cp1" | "cp2" | "end"
>([
  ["start", "cp1"],
  ["cp1", "cp2"],
  ["cp2", "end"],
]);

const { getCheckpointCoords, getEndpointCoords, drawPacket } =
  packetAnimationUtils;
export const packetAnimations = {
  packetTransfer: async function (
    context: CanvasRenderingContext2D,
    cellSize: number,
    src: Router,
    dest: Router,
    duration: number,
    packetRect: RectDim = getDefaultPacketRect(cellSize),
    color: string
  ) {
    let status: "start" | "cp1" | "cp2" | "end" = "start";
    if (!context) {
      return;
    }
    const { w: rectW, h: rectH } = packetRect;
    const from = getEndpointCoords(cellSize, src.location);
    const to = getEndpointCoords(cellSize, dest.location);
    const { cp1, cp2 } = getCheckpointCoords(
      cellSize,
      src.location,
      dest.location
    );
    const [fromX, fromY] = from;
    const [toX, toY] = to;
    if (fromX === toX && fromY === toY) {
      return;
    }
    const totalDistance = getEuclideanDistance(from, to);
    const [cp1x, cp1y] = cp1;
    const [cp2x, cp2y] = cp2;
    let position: Point2D = [...from];
    const startTime = Date.now();
    let cpStartTime = startTime;
    while (status !== "end") {
      let p1: Point2D, p2: Point2D;
      let cpx: number, cpy: number;
      switch (status) {
        case "start":
          p1 = from;
          p2 = cp1;
          cpx = cp1x;
          cpy = cp1y;
          break;
        case "cp1":
          p1 = cp1;
          p2 = cp2;
          cpx = cp2x;
          cpy = cp2y;
          break;
        case "cp2":
        default:
          p1 = cp2;
          p2 = to;
          cpx = toX;
          cpy = toY;
          break;
      }
      const distance = getEuclideanDistance(p1, p2);
      const { p1: low } = getAllRectPointsFromCentroid(position, rectW, rectH);
      position = await new Promise<Point2D>((resolve) => {
        window.requestAnimationFrame(() => {
          beforeDraw(context);
          context.clearRect(low[0] - 1, low[1] - 1, rectW + 2, rectH + 2);
          postDraw(context);
          resolve(
            drawPacket(
              context,
              p1,
              p2,
              cpStartTime,
              (distance * duration) / totalDistance,
              packetRect,
              color
            )
          );
        });
      });
      const [px, py] = position;
      const { directionX, directionY } = getTravelDirection(p1, p2);
      const isPastCp =
        directionX === "none"
          ? directionY === "top"
            ? py <= cpy
            : py >= cpy
          : directionX === "right"
          ? px >= cpx
          : px <= cpx;
      if (isPastCp) {
        status = nextPacketStatus.get(status) || "start";
        cpStartTime = Date.now();
      }
    }
    const { p1: low } = getAllRectPointsFromCentroid(position, rectW, rectH);
    context.clearRect(low[0] - 1, low[1] - 1, rectW + 2, rectH + 2);
  },

  /**
   * Method to animate a packet drop by a router
   * @param router
   * @param duration Duration of the anim in ms
   * @param color
   * @returns
   */
  packetDrop: async (
    context: CanvasRenderingContext2D,
    cellSize: number,
    router: Router,
    duration: number,
    color: string,
    rectDim: RectDim = getDefaultPacketRect(cellSize)
  ) => {
    const { w: rectW, h: rectH } = rectDim;
    const { location } = router;
    const [col, row] = location;
    const origin: Point2D = [
      cellSize * (col + 1 / 2),
      cellSize * (row + 1 / 2),
    ];
    const cp1y = cellSize * (row + 1);
    // packet ends at the midpoint of the cell below
    const dest: Point2D = [cellSize * (col + 1 / 2), cellSize * (row + 3 / 2)];
    const [, destY] = dest;
    let position: Point2D = [...origin];
    const startTime = Date.now();
    const totalDistance = getEuclideanDistance(origin, dest);
    const v = totalDistance / duration;
    const startY = position[1];
    while (position[1] <= destY) {
      await new Promise<void>((resolve) =>
        window.requestAnimationFrame(() => {
          const { p1: prevLow } = getAllRectPointsFromCentroid(
            position,
            rectW,
            rectH
          );
          beforeDraw(context);
          context.clearRect(
            prevLow[0] - 1,
            prevLow[1] - 1,
            rectW + 2,
            rectH + 2
          );
          const time = Date.now() - startTime;
          const distance = v * time;
          const y = startY + distance;
          position = [position[0], y];
          const { p1: low } = getAllRectPointsFromCentroid(
            position,
            rectW,
            rectH
          );
          const [, lowY] = low;
          context.fillStyle = color;
          if (lowY > cp1y) {
            context.globalAlpha = (destY - y) / (destY - cp1y);
          }
          context.beginPath();
          context.rect(...low, rectW, rectH);
          context.fill();
          context.closePath();
          postDraw(context);
          resolve();
        })
      );
    }
    const { p1: low } = getAllRectPointsFromCentroid(position, rectW, rectH);
    beforeDraw(context);
    context.clearRect(low[0] - 1, low[1] - 1, rectW + 2, rectH + 2);
    postDraw(context);
  },
};
