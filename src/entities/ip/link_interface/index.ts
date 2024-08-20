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

  private assignIps = (routers?: Router[]) => {
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
        router.addInterface(this);
      });
      routers.forEach((router) => {
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
    const destRouter = this.getOppositeRouter(from);
    if (!fromIpStr) {
      throw new Error(
        "Unexpected sendMessage call on Link Interface. Does not connect the said IP address."
      );
    }
    const { theta } = getSlopeAngleDist2D(from.location, destRouter.location);
    const { startX, startY, endX, endY } = getLinkInterfaceCoords(
      from.location,
      destRouter.location,
      theta,
      this.gridCellSize
    );
    this.drawPacket(
      [startX, startY],
      [endX, endY],
      [startX, startY],
      Date.now(),
      Date.now() + animTime,
      color
    );
    const fromIp = IPv4Address.fromString(fromIpStr);
    switch (protocol) {
      case IPProtocolNumber.ospf:
        return ospfMessageHandler(this.id, fromIp, to, message, this.routers);
      default:
        break;
    }
  };

  drawPacket = (
    from: Point2D,
    to: Point2D,
    prevPosition: Point2D,
    startTime: number,
    endTime: number,
    color: string
  ) => {
    if (!this.elementLayerContext || Date.now() > endTime) {
      return;
    }
    const context = this.elementLayerContext;
    const [aX, aY] = from;
    const [bX, bY] = to;
    const directionX = bX === aX ? "none" : bX < aX ? "left" : "right";
    const directionY = bY === aY ? "none" : bY < aY ? "top" : "bottom";
    const { slope, distance: totalDistance } = getSlopeAngleDist2D(from, to);
    const v = totalDistance / (endTime - startTime);
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
    context.save();
    context.globalCompositeOperation = "destination-out";
    const r = 10;
    context.beginPath();
    context.arc(prevPosition[0], prevPosition[1], r, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
    context.globalCompositeOperation = "source-over";
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
    context.restore();
    window.requestAnimationFrame(() =>
      this.drawPacket(from, to, [x, y], startTime, endTime, color)
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
