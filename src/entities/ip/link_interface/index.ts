import { IPProtocolNumber } from "../enum/ip_protocol_number";
import { IPv4Address } from "../ipv4_address";
import { TwoWayMap } from "../../../utils/two_way_map";
import { IPacket } from "../../interfaces/IPacket";
import { ospfMessageHandler } from "../../message_handlers/ospf_message_handler";
import { Router } from "../../router";
import { BACKBONE_AREA_ID } from "../../ospf/constants";
import { Colors } from "../../../constants/theme";
import {
  getLinkInterfaceCoords,
  getSlopeAngleDist2D,
} from "../../../utils/drawing";
import { Point2D } from "../../../types/geometry";
import { packetAnimationUtils } from "./utils";
import { getAllRectPointsFromCentroid } from "../../../utils/geometry";

const { getCheckpointCoords, getEndpointCoords, drawPacket } =
  packetAnimationUtils;

const nextPacketStatus = new Map<
  "start" | "cp1" | "cp2" | "end",
  "start" | "cp1" | "cp2" | "end"
>([
  ["start", "cp1"],
  ["cp1", "cp2"],
  ["cp2", "end"],
]);
/**
 * The Network layer (IP) link between two routers. Supports sending and receiving network layer IP Messages.
 */
export class IPLinkInterface {
  id: string;
  routers: TwoWayMap<string, Router>;
  baseIp: IPv4Address;
  gridCellSize: number;
  connectionLayerContext?: CanvasRenderingContext2D | null;
  elementLayerContext?: CanvasRenderingContext2D | null;
  constructor(
    id: string,
    baseIp: IPv4Address,
    gridCellSize: number,
    routers: [Router, Router],
    connectionLayerContext?: CanvasRenderingContext2D | null,
    elementLayerContext?: CanvasRenderingContext2D | null
  ) {
    this.id = id;
    this.baseIp = baseIp;
    this.gridCellSize = gridCellSize;
    this.connectionLayerContext = connectionLayerContext;
    this.elementLayerContext = elementLayerContext;
    this.routers = new TwoWayMap();
    this.assignIps(routers);
  }

  private assignIps = (routers: [Router, Router]) => {
    const [byte1, byte2, byte3] = this.baseIp.bytes;
    let b3 = byte3;
    let backboneRouterPresent = false;
    if (routers && routers.length > 0) {
      routers.forEach((router) => {
        const { ospf } = router;
        const { config } = ospf;
        const { areaId } = config;
        const interfaceIp = new IPv4Address(byte1, byte2, ++b3, 0, 24);
        this.routers.set(interfaceIp.toString(), router);
        backboneRouterPresent =
          backboneRouterPresent || areaId === BACKBONE_AREA_ID;
      });
      routers.forEach((router) => {
        router.addInterface(this);
        const { ospf } = router;
        const { config } = ospf;
        const { areaId, connectedToBackbone } = config;
        config.connectedToBackbone =
          areaId !== BACKBONE_AREA_ID &&
          (connectedToBackbone || backboneRouterPresent);
      });
    }
  };

  /**
   * Gets the router on the other side of the link.
   * @param sourceRouter The source Router.
   */
  getOppositeRouter = (sourceRouter: Router) => {
    const routers = Array.from(this.routers.values()).filter(
      (router) => router !== sourceRouter
    );
    return routers[0];
  };

  /**
   * Sends a message to a destination IP address. the destination must be connected to this link interface.
   * @param from
   * @param to
   * @param protocol
   * @param message
   * @param color Color of the packet to be drawn
   */
  sendMessage = (
    from: Router,
    to: IPv4Address,
    protocol: IPProtocolNumber,
    message: IPacket,
    color: string = Colors.accent,
    animTime: number = 2500
  ) => {
    const fromIpStr = this.routers.getKey(from);
    const dest = this.getOppositeRouter(from);
    if (!fromIpStr) {
      throw new Error(
        "Unexpected sendMessage call on Link Interface. Does not connect the said IP address."
      );
    }
    const start = getEndpointCoords.call(this, from.location);
    const end = getEndpointCoords.call(this, dest.location);
    const { cp1, cp2 } = getCheckpointCoords.call(
      this,
      from.location,
      dest.location
    );
    this.animatePacket(
      start,
      end,
      cp1,
      cp2,
      start,
      Date.now(),
      Date.now() + animTime,
      color,
      "start"
    );
    const fromIp = IPv4Address.fromString(fromIpStr);
    switch (protocol) {
      case IPProtocolNumber.ospf:
        return ospfMessageHandler(this.id, fromIp, to, message, this.routers);
      default:
        break;
    }
  };

  animatePacket = (
    from: Point2D,
    to: Point2D,
    cp1: Point2D,
    cp2: Point2D,
    prevPosition: Point2D,
    startTime: number,
    endTime: number,
    color: string,
    status: "start" | "cp1" | "cp2" | "end",
    cpStartTime: number = startTime
  ) => {
    const rectW = 16,
      rectH = 10;
    if (!this.elementLayerContext) {
      return;
    }
    const { distance: totalDistance } = getSlopeAngleDist2D(from, to);
    const totalTime = endTime - startTime;
    const context = this.elementLayerContext;
    const { p1: low } = getAllRectPointsFromCentroid(
      prevPosition,
      rectW,
      rectH
    );
    context.clearRect(low[0] - 1, low[1] - 1, rectW + 2, rectH + 2);
    let p1: Point2D, p2: Point2D;
    switch (status) {
      case "start":
        p1 = from;
        p2 = cp1;
        break;
      case "cp1":
        p1 = cp1;
        p2 = cp2;
        break;
      case "cp2":
      default:
        p1 = cp2;
        p2 = to;
        break;
    }
    const { distance } = getSlopeAngleDist2D(p1, p2);
    const time = (distance * totalTime) / totalDistance;
    const position = drawPacket.call(
      this,
      p1,
      p2,
      cpStartTime,
      time,
      { rectW, rectH },
      color
    );
    const [aX, aY] = p1;
    const [bX, bY] = p2;
    const [px, py] = prevPosition;
    const [cp1x, cp1y] = cp1;
    const [cp2x, cp2y] = cp2;
    const cpx = status === "start" ? cp1x : status === "cp1" ? cp2x : bX;
    const cpy = status === "start" ? cp1y : status === "cp1" ? cp2y : bY;
    const directionX = bX === aX ? "none" : bX < aX ? "left" : "right";
    const directionY = bY === aY ? "none" : bY < aY ? "top" : "bottom";
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
    if (status === "end") {
      context.clearRect(position[0] - 1, position[1] - 1, rectW + 2, rectH + 2);
      return;
    }
    window.requestAnimationFrame(() =>
      this.animatePacket(
        from,
        to,
        cp1,
        cp2,
        position,
        startTime,
        endTime,
        color,
        status,
        cpStartTime
      )
    );
  };

  draw = (routerA: Router, routerB: Router) => {
    if (
      typeof this.gridCellSize === "undefined" ||
      !this.connectionLayerContext
    ) {
      return;
    }
    const cellSize = this.gridCellSize;
    const context = this.connectionLayerContext;
    const { location: locA } = routerA;
    const [aX, aY] = locA;
    const { location: locB } = routerB;
    const [bX, bY] = locB;
    const { theta } = getSlopeAngleDist2D(locA, locB);
    context.save();
    const distance = Math.sqrt((bX - aX) ** 2 + (bY - aY) ** 2);
    context.strokeStyle = "black";
    context.fillStyle = "black";
    context.beginPath();
    const { startX, startY, endX, endY } = getLinkInterfaceCoords(
      locA,
      locB,
      theta,
      cellSize
    );
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.font = "16px sans-serif";
    const textX = (startX + endX) / 2,
      textY = (startY + endY) / 2;
    context.translate(textX, textY);
    context.rotate(theta);
    context.fillText(distance.toFixed(2), 0, -5);
    context.stroke();
    context.fill();
    context.closePath();
    context.restore();
  };
}
