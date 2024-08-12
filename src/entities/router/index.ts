import { Point2D } from "../../types/geometry";
import { IPv4Address } from "../ip/ipv4_address";
import { OSPFPacket } from "../ospf/packets/packet_base";
import { IPLinkInterface } from "../ip/link_interface";
import { IPPacket } from "../ip/packets";
import { IPProtocolNumber } from "../ip/enum/ip_protocol_number";
import { OSPFInterface } from "./ospf_interface";
import { OSPFConfig } from "../ospf/config";
import { RoutingTableRow as BGPTableRow } from "../bgp/tables"; // TODO: Create a separate BGP interface and add to that.

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
  ipInterfaces: Map<string, IPLinkInterface>;
  ospf: OSPFInterface;
  bgpTable: BGPTableRow[];

  constructor(
    key: string,
    location: Point2D,
    id: IPv4Address,
    ospfConfig: OSPFConfig
  ) {
    this.key = key;
    this.location = location;
    this.id = id;
    this.ipInterfaces = new Map();
    this.bgpTable = [];
    this.ospf = new OSPFInterface(this, ospfConfig);
  }

  addInterface = (ipInterface: IPLinkInterface) => {
    const { id } = ipInterface;
    this.ipInterfaces.set(id, ipInterface);
  };

  receiveIPPacket = (interfaceId: string, packet: IPPacket) => {
    const { header, body } = packet;
    const { protocol, source } = header;
    const { receivePacket } = this.ospf;
    switch (protocol) {
      case IPProtocolNumber.ospf:
        receivePacket(interfaceId, source, body as OSPFPacket);
        break;
      default:
        break;
    }
  };
}
