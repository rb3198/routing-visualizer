import { Point2D } from "../../types/geometry";
import { IPv4Address } from "../ip/ipv4_address";
import { OSPFPacket } from "../ospf/packets/packet_base";
import { IPLinkInterface } from "../ip/link_interface";
import { IPPacket } from "../ip/packets";
import { IPProtocolNumber } from "../ip/enum/ip_protocol_number";
import { OSPFInterface } from "./ospf_interface";
import { OSPFConfig } from "../ospf/config";
import { RoutingTableRow as BGPTableRow } from "../bgp/tables"; // TODO: Create a separate BGP interface and add to that.
import { BACKBONE_AREA_ID } from "../ospf/constants";

export class Router {
  key: string;
  /**
   * Location of the router on the grid.
   */
  location: Point2D;
  /**
   * Router ID of this router, typically a Loopback IP Address.
   */
  id: IPv4Address;
  ipInterfaces: Map<
    string,
    {
      ipInterface: IPLinkInterface;
      helloTimer?: NodeJS.Timeout;
    }
  >;
  ospf: OSPFInterface;
  bgpTable: BGPTableRow[];
  /**
   * Boolean to indicate if the router is turned on.
   */
  turnedOn: boolean;

  constructor(
    key: string,
    location: Point2D,
    id: IPv4Address,
    ospfConfig: OSPFConfig,
    turnedOn?: boolean
  ) {
    this.key = key;
    this.location = location;
    this.id = id;
    this.ipInterfaces = new Map();
    this.bgpTable = [];
    this.ospf = new OSPFInterface(this, ospfConfig);
    this.turnedOn = turnedOn ?? false;
  }

  addInterface = (ipInterface: IPLinkInterface) => {
    const { id } = ipInterface;
    this.ipInterfaces.set(id, { ipInterface });
    if (this.turnedOn) {
      // IF turnedOn send hello packet immediately on the new interface.
      this.ospf.sendHelloPacket(ipInterface);
    }
  };

  removeInterface = (ip: IPv4Address | string) => {
    // Clear the hello timer associated with the interface and remove the interface.
    const ipLink = this.ipInterfaces.get(ip.toString());
    if (!ipLink) {
      return;
    }
    const { helloTimer } = ipLink;
    clearInterval(helloTimer);
    this.ipInterfaces.delete(ip.toString());
    const { ospf } = this;
    const { config } = ospf;
    const oppRouter = ipLink.ipInterface.getOppositeRouter(this);
    if (oppRouter) {
      // If the router on the opposite side of the link was in the backbone area,
      // the current area is no longer connected to the backbone since the its single link to the backbone was deleted.
      config.connectedToBackbone &&=
        oppRouter.ospf.config.areaId !== BACKBONE_AREA_ID;
    }
  };

  receiveIPPacket = (interfaceId: string, packet: IPPacket) => {
    const { header, body } = packet;
    const { protocol, source, id } = header;
    const { receivePacket } = this.ospf;
    switch (protocol) {
      case IPProtocolNumber.ospf:
        receivePacket(id, interfaceId, source, body as OSPFPacket);
        break;
      default:
        break;
    }
  };

  turnOn = () => {
    const { config } = this.ospf;
    const { helloInterval } = config;
    if (this.turnedOn) {
      return;
    }
    this.turnedOn = true;
    for (const [ip, { ipInterface }] of this.ipInterfaces) {
      const helloTimer = setInterval(() => {
        this.ospf.sendHelloPacket(ipInterface);
      }, helloInterval);
      this.ipInterfaces.set(ip, {
        ipInterface,
        helloTimer,
      });
    }
  };
}
