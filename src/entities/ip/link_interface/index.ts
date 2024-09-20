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
import { store } from "../../../store";

/**
 * The Network layer (IP) link between two routers. Supports sending and receiving network layer IP Messages.
 */
export class IPLinkInterface {
  id: string;
  routers: TwoWayMap<string, Router>;
  cost: number;
  ipMsb: number;
  constructor(
    id: string,
    ipMsb: number,
    b3Init: number,
    routers: [Router, Router]
  ) {
    this.id = id;
    this.ipMsb = ipMsb;
    this.routers = new TwoWayMap();
    this.assignIps(routers, b3Init);
    const [routerA, routerB] = routers;
    const { location: locA } = routerA;
    const [aX, aY] = locA;
    const { location: locB } = routerB;
    const [bX, bY] = locB;
    const distance = Math.sqrt((bX - aX) ** 2 + (bY - aY) ** 2);
    this.cost = parseInt(distance.toFixed(2));
  }

  private assignIps = (routers: [Router, Router], b3Init: number) => {
    let b3 = b3Init * 2;
    let backboneRouterPresent = false;
    if (routers && routers.length > 0) {
      routers.forEach((router) => {
        const { ospf } = router;
        const { config } = ospf;
        const { areaId } = config;
        backboneRouterPresent =
          backboneRouterPresent || areaId === BACKBONE_AREA_ID;
      });
      routers.forEach((router) => {
        const { ospf } = router;
        const { config } = ospf;
        const { areaId, connectedToBackbone } = config;
        config.connectedToBackbone =
          areaId !== BACKBONE_AREA_ID &&
          (connectedToBackbone || backboneRouterPresent);
        const interfaceIp = new IPv4Address(
          this.ipMsb,
          (backboneRouterPresent ? 0 : areaId) + 1,
          b3++,
          0,
          16
        );
        this.routers.set(interfaceIp.toString(), router);
      });
      routers.forEach((router) => router.addInterface(this));
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
  sendMessage = async (
    from: Router,
    to: IPv4Address,
    protocol: IPProtocolNumber,
    message: IPacket,
    color: string = Colors.accent,
    duration: number = 2000
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
        ospfMessageHandler.call(
          this,
          this.id,
          fromIp,
          to,
          message,
          this.routers,
          color,
          duration
        );
        break;
      default:
        break;
    }
  };

  draw = (routerA: Router, routerB: Router) => {
    const { cellSize } = store.getState();
    const context = window.routerConnectionLayer?.getContext("2d");
    if (!context) {
      return;
    }
    const { location: locA } = routerA;
    const { location: locB } = routerB;
    const { theta } = getSlopeAngleDist2D(locA, locB);
    context.save();
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
    context.fillText(this.cost.toString(), 0, -5);
    context.stroke();
    context.fill();
    context.closePath();
    context.restore();
  };
}
