import { Router } from "../../entities/router";
import { Point2D, RectDim } from "../../types/geometry";
import {
  beforeDraw,
  getCellSize,
  getDefaultPacketRect,
  postDraw,
} from "../../utils/drawing";
import {
  getAllRectPointsFromCentroid,
  getEuclideanDistance,
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
    const totalDistance =
      getEuclideanDistance(from, cp1) +
      getEuclideanDistance(cp1, cp2) +
      getEuclideanDistance(cp2, to);
    let position: Point2D = [...from];
    const startTime = Date.now();
    let cpStartTime = startTime;
    while (status !== "end") {
      let distance = getEuclideanDistance(from, cp1);
      let p1: Point2D, p2: Point2D;
      switch (status) {
        case "start":
          p1 = from;
          p2 = cp1;
          break;
        case "cp1":
          p1 = cp1;
          p2 = cp2;
          distance += getEuclideanDistance(cp1, cp2);
          break;
        case "cp2":
        default:
          p1 = cp2;
          p2 = to;
          distance += getEuclideanDistance(cp2, to);
          break;
      }
      const { p1: low } = getAllRectPointsFromCentroid(position, rectW, rectH);
      const updatePosition = async (cpStartTime: number, distance: number) => {
        return await new Promise<Point2D>((resolve) => {
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
      };
      position = await updatePosition(cpStartTime, distance);
      const [px, py] = position;
      // Vector from p1 to p2
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      // Vector from p1 to current position
      const dpx = px - p1[0];
      const dpy = py - p1[1];
      // Dot product of the two vectors
      const dot = dx * dpx + dy * dpy;
      // If dot > squared distance between p1 and p2, we’ve passed the checkpoint
      const segmentLengthSquared = dx * dx + dy * dy;
      const isPastCp = dot >= segmentLengthSquared;
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
    router: Router,
    duration: number,
    color: string,
    rectDim?: RectDim
  ) => {
    const cellSize = getCellSize();
    rectDim ??= getDefaultPacketRect(cellSize);
    const { w: rectW, h: rectH } = rectDim;
    const { location } = router;
    const [col, row] = location;
    const origin: Point2D = [col + cellSize / 2, row + cellSize / 2];
    const cp1y = row + cellSize;
    // packet ends at the midpoint of the cell below
    const dest: Point2D = [col + cellSize / 2, row + (3 * cellSize) / 2];
    const [, destY] = dest;
    let position: Point2D = [...origin];
    const startTime = Date.now();
    const totalDistance = getEuclideanDistance(origin, dest);
    const v = totalDistance / duration;
    const startY = position[1];
    while (position[1] <= destY) {
      const updatePosition = (position: Point2D) => {
        return new Promise<Point2D>((resolve) => {
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
            resolve(position);
          });
        });
      };
      position = await updatePosition(position);
    }
    const { p1: low } = getAllRectPointsFromCentroid(position, rectW, rectH);
    beforeDraw(context);
    context.clearRect(low[0] - 1, low[1] - 1, rectW + 2, rectH + 2);
    postDraw(context);
  },
};
