import { IPv4Address } from "../ipv4_address";
import { TwoWayMap } from "../../../utils/two_way_map";
import { Router } from "../../router";
import { BACKBONE_AREA_ID } from "../../ospf/constants";
import { Colors, OspfPacketColorMap } from "../../../constants/theme";
import { getLinkInterfaceCoords } from "../../../utils/drawing";
import { store } from "../../../store";
import { vmax } from "src/utils/geometry";
import { IPPacket } from "../packets";
import { packetAnimations } from "src/animations/packets";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { BROADCAST_ADDRESSES } from "src/constants/ip_addresses";

const getPacketColor = (ipPacket: IPPacket) => {
  let color = Colors.accent;
  const { body } = ipPacket;
  if (body instanceof OSPFPacket) {
    const { header: ospfHeader } = body;
    const { type } = ospfHeader;
    color = OspfPacketColorMap.get(type) ?? color;
  }
  return color;
};

/**
 * The Network layer (IP) link between two routers. Supports sending and receiving network layer IP Messages.
 */
export class IPLinkInterface {
  id: string;
  routers: TwoWayMap<string, Router>;
  cost: number;
  baseIp: IPv4Address;
  constructor(
    id: string,
    ipMsb: number,
    b3Init: number,
    routers: [Router, Router]
  ) {
    this.id = id;
    this.baseIp = new IPv4Address(ipMsb, 0, b3Init, 0, 24);
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

  private assignIps = (routers: [Router, Router], b3: number) => {
    let backboneRouterPresent = false;
    if (routers && routers.length > 0) {
      routers.forEach((router) => {
        const { ospf } = router;
        const { config } = ospf;
        const { areaId } = config;
        backboneRouterPresent =
          backboneRouterPresent || areaId === BACKBONE_AREA_ID;
      });
      this.baseIp.bytes[1] = backboneRouterPresent
        ? 1
        : routers[0].ospf.config.areaId + 1;
      routers.forEach((router, idx) => {
        const { ospf } = router;
        const { config } = ospf;
        const { areaId, connectedToBackbone } = config;
        config.connectedToBackbone =
          areaId !== BACKBONE_AREA_ID &&
          (connectedToBackbone || backboneRouterPresent);
        const interfaceIp = new IPv4Address(
          this.baseIp.bytes[0],
          this.baseIp.bytes[1],
          b3,
          idx + 1,
          24
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

  getSelfIpAddress = (self: Router) => {
    return this.routers.getKey(self);
  };

  sendMessage = async (src: Router, ipPacket: IPPacket) => {
    const { cellSize, simulationConfig } = store.getState();
    const { propagationDelay: duration } = simulationConfig;
    const context = window.elementLayer?.getContext("2d");
    const dest = this.getOppositeRouter(src);
    const destIp = this.getSelfIpAddress(dest);
    if (!destIp) {
      return;
    }
    const color = getPacketColor(ipPacket);
    if (BROADCAST_ADDRESSES.has(ipPacket.header.destination.toString())) {
      src.receiveIPPacket(
        this.getSelfIpAddress(src)?.toString() ?? "",
        ipPacket
      );
    }
    context &&
      (await packetAnimations.packetTransfer(
        context,
        cellSize,
        src,
        dest,
        duration,
        undefined,
        color
      ));
    dest.receiveIPPacket(destIp, ipPacket);
  };

  private drawIps = (
    context: CanvasRenderingContext2D,
    routerA: Router,
    routerB: Router
  ) => {
    const { cellSize } = store.getState();
    const ipAStr = this.routers.getKey(routerA);
    const ipBStr = this.routers.getKey(routerB);
    if (!ipAStr || !ipBStr) {
      console.warn("Draw IPs called with unknown routers");
      return;
    }
    const ipA = IPv4Address.fromString(ipAStr);
    const ipB = IPv4Address.fromString(ipBStr);
    let { location: start } = routerA;
    let { location: end } = routerB;
    const {
      startX,
      startY,
      endX,
      endY,
      startThetaOffset,
      endThetaOffset,
      theta,
    } = getLinkInterfaceCoords(cellSize, start, end, true);
    const padding = vmax(0.1);
    [
      {
        x: startX,
        y: startY,
        ip: `.${ipA.bytes[3]}`,
        offset: startThetaOffset,
      },
      { x: endX, y: endY, ip: `.${ipB.bytes[3]}`, offset: endThetaOffset },
    ].forEach(({ x, y, ip, offset }) => {
      const {
        actualBoundingBoxLeft: left,
        actualBoundingBoxRight: right,
        fontBoundingBoxAscent: asc,
        fontBoundingBoxDescent: dsc,
      } = context.measureText(ip);
      const textWidth = left + right;
      const textHeight = asc + dsc;
      context.save();
      context.font = "1vmin sans-serif";
      context.strokeStyle = "white";
      context.fillStyle = "black";
      context.translate(x, y);
      context.rotate(theta + offset + Math.PI / 2);
      context.translate(-textWidth / 2, 0);
      context.beginPath();
      context.fillStyle = "black";
      context.rect(
        0,
        -textHeight,
        textWidth + 4 * padding,
        textHeight + 2 * padding
      );
      context.fill();
      context.closePath();
      context.beginPath();
      context.fillStyle = "white";
      context.fillText(ip.toString(), padding, padding);
      context.closePath();
      context.restore();
    });
  };

  draw = (routerA: Router, routerB: Router) => {
    const { cellSize } = store.getState();
    const context = window.routerConnectionLayer?.getContext("2d");
    if (!context) {
      return;
    }
    const { location: locA } = routerA;
    const { location: locB } = routerB;
    let { startX, startY, endX, endY, theta, directionX } =
      getLinkInterfaceCoords(cellSize, locA, locB);
    if (directionX === "none" && locA[0] === locB[0]) {
      startX += cellSize / 2;
      endX += cellSize / 2;
    }
    context.save();
    context.strokeStyle = "black";
    context.fillStyle = "black";
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.font = "1vmax sans-serif";
    const costX = (startX + endX) / 2,
      costY = (startY + endY) / 2;
    context.translate(costX, costY);
    context.rotate(theta);
    context.fillText(this.cost.toString(), 0, -5);
    context.stroke();
    context.fill();
    context.closePath();
    context.beginPath();
    context.font = "0.65vmax sans-serif";
    const { width } = context.measureText(this.baseIp.toString());
    const x = -width / 2;
    context.fillText(this.baseIp.toString(), x, 12.5);
    context.closePath();
    context.restore();
    this.drawIps(context, routerA, routerB);
  };
}
