import { IPProtocolNumber } from "./enum/ip_protocol_number";
import { IPv4Address } from "./ipv4_address";
import { TwoWayMap } from "../../utils/two_way_map";
import { IPacket } from "../interfaces/IPacket";
import { ospfMessageHandler } from "../message_handlers/ospf_message_handler";
import { Router } from "../router";
import { BACKBONE_AREA_ID } from "../ospf/constants";

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
   */
  getOppositeRouter = (sourceRouter: Router) => {
    const routers = Array.from(this.routers.values()).filter(
      (router) => router !== sourceRouter
    );
    return routers[0];
  };

  /**
   * Sends a message to a destination IP address. the destination must be connected to this link interface.
   * @param to
   * @param protocol
   * @param message
   */
  sendMessage = (
    from: Router,
    to: IPv4Address,
    protocol: IPProtocolNumber,
    message: IPacket
  ) => {
    const fromIpStr = this.routers.getKey(from);
    if (!fromIpStr) {
      throw new Error(
        "Unexpected sendMessage call on Link Interface. Does not connect the said IP address."
      );
    }
    const fromIp = IPv4Address.fromString(fromIpStr);
    switch (protocol) {
      case IPProtocolNumber.ospf:
        return ospfMessageHandler(this.id, fromIp, to, message, this.routers);
      default:
        break;
    }
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
    const slope = (bY - aY) / (bX - aX);
    const theta = Math.atan(slope);
    context.save();
    const distance = Math.sqrt((bX - aX) ** 2 + (bY - aY) ** 2);
    context.strokeStyle = "black";
    context.fillStyle = "black";
    let startX = aX * cellSize + cellSize / 2,
      startY = aY * cellSize,
      endX = bX * cellSize + cellSize / 2,
      endY = (bY + 1) * cellSize;
    context.beginPath();
    if (theta === Math.PI / 2) {
      startY = (aY + 1) * cellSize;
      endY = bY * cellSize;
    } else if (theta !== -Math.PI / 2) {
      startX = (aX > bX ? aX : aX + 1) * cellSize;
      startY = aY * cellSize + cellSize / 2;
      endX = (aX > bX ? bX + 1 : bX) * cellSize;
      endY = bY * cellSize + cellSize / 2;
    }
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
