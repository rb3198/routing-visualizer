import { Point2D } from "../../types/geometry";
import { IPv4Address } from "../ip/ipv4_address";
import { IPLinkInterface } from "../ip/link_interface";
import { IPPacket } from "../ip/packets";
import { IPProtocolNumber } from "../ip/enum/ip_protocol_number";
import { OSPFInterface } from "./ospf_interface";
import { OSPFConfig } from "../ospf/config";
import { RoutingTableRow as BGPTableRow } from "../bgp/tables"; // TODO: Create a separate BGP interface and add to that.
import { BACKBONE_AREA_ID } from "../ospf/constants";
import { store } from "../../store";
import { emitEvent } from "../../action_creators";
import { InterfaceNetworkEvent } from "../network_event/interface_event";

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
    const { config } = this.ospf;
    const { helloInterval } = config;
    let helloTimer: NodeJS.Timeout | undefined;
    emitEvent({
      eventName: "interfaceEvent",
      event: new InterfaceNetworkEvent("added", this),
    })(store.dispatch);
    if (this.turnedOn) {
      // IF turnedOn send hello packet immediately on the new interface.
      this.ospf.sendHelloPacket(ipInterface);
      helloTimer = setInterval(() => {
        this.ospf.sendHelloPacket(ipInterface);
      }, helloInterval);
    }
    this.ipInterfaces.set(id, {
      ipInterface,
      helloTimer,
    });
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
    const { header } = packet;
    const { protocol } = header;
    const { receivePacket } = this.ospf;
    if (!this.turnedOn) {
      return;
    }
    switch (protocol) {
      case IPProtocolNumber.ospf:
        receivePacket(interfaceId, packet);
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
      this.ospf.sendHelloPacket(ipInterface);
      const helloTimer = setInterval(() => {
        this.ospf.sendHelloPacket(ipInterface);
      }, helloInterval);
      this.ipInterfaces.set(ip, {
        ipInterface,
        helloTimer,
      });
    }
    return { ...this };
  };

  turnOff = () => {
    this.turnedOn = false;
    this.ospf.lsDb.clearTimers();
    Object.values(this.ospf.neighborTable).forEach(
      ({
        deadTimer,
        ddRxmtTimer,
        lsRequestRxmtTimer,
        lsRetransmissionRxmtTimer,
      }) => {
        clearTimeout(deadTimer);
        clearInterval(ddRxmtTimer);
        clearInterval(lsRequestRxmtTimer);
        clearTimeout(lsRetransmissionRxmtTimer);
      }
    );
    this.ospf.neighborTable = {};
    [...this.ipInterfaces.values()].forEach(({ helloTimer }) => {
      clearInterval(helloTimer);
    });
    return { ...this };
  };
}
