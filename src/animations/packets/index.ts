import { Router } from "../../entities/router";
import { Point2D, RectDim } from "../../types/geometry";
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
    packetRect: RectDim = { w: cellSize / 2, h: cellSize / 3.5 },
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
          context.clearRect(low[0] - 1, low[1] - 1, rectW + 2, rectH + 2);
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
    context.clearRect(position[0] - 1, position[1] - 1, rectW + 2, rectH + 2);
  },
};
