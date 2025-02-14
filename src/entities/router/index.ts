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
import { emitEvent0 } from "../../action_creators";
import { RoutingTableRow } from "../ospf/table_rows";
import { IPacket } from "../interfaces/IPacket";
import { IPHeader } from "../ip/packets/header";
import { BROADCAST_ADDRESSES } from "src/constants/ip_addresses";
import { packetAnimations } from "src/animations/packets";
import { Colors } from "src/constants/theme";
import { PacketSentEventBuilder } from "../network_event/event_builders/packets/sent";
import { PacketDroppedEventBuilder } from "../network_event/event_builders/packets/dropped";
import { InterfaceEventBuilder } from "../network_event/event_builders/interfaces";

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
  turnedOn: boolean | "turning_off";

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
    const { config } = this.ospf;
    const { helloInterval } = config;
    let helloTimer: NodeJS.Timeout | undefined;
    const selfAddress = ipInterface.getSelfIpAddress(this) ?? "";
    store.dispatch(
      emitEvent0(InterfaceEventBuilder(this, "added", selfAddress))
    );
    if (this.turnedOn === true) {
      // IF turnedOn send hello packet immediately on the new interface.
      this.ospf.sendHelloPacket(ipInterface);
      helloTimer = setInterval(() => {
        this.ospf.sendHelloPacket(ipInterface);
      }, helloInterval);
    }
    this.ipInterfaces.set(selfAddress, {
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

  private routingTableLookup = (destination: IPv4Address) => {
    const { routingTableManager } = this.ospf;
    const { table: routingTable } = routingTableManager.getFullTables();
    let longestMatchRow: RoutingTableRow | undefined = undefined,
      longestMatch = -1;
    for (const row of routingTable) {
      const rowId = new IPv4Address(...row.destinationId.bytes);
      if (!rowId.fromSameSubnet(destination)) {
        continue;
      }
      const i = rowId
        .getPrefix()
        .split("")
        .filter((c) => c !== "*").length;
      if (i > longestMatch) {
        longestMatch = i;
        longestMatchRow = row;
      }
    }
    return longestMatchRow;
  };

  sendIpPacket = (ipPacket: IPPacket, isSelfOriginated?: boolean) => {
    const { header } = ipPacket;
    const { destination, source } = header;
    if (isSelfOriginated) {
      const sourceIp = IPv4Address.fromString(source.toString());
      const ipInterface = this.ipInterfaces.get(sourceIp.toString());
      ipInterface?.ipInterface.sendMessage(this, ipPacket);
      return;
    }
    const longestMatchRow = this.routingTableLookup(destination);
    if (!longestMatchRow || !longestMatchRow.nextHops.length) {
      // TODO: Show tooltip.
      console.warn(`Unable to route the message to destination ${destination}`);
      return;
    }
    const { nextHops, lastUsedNextHopIdx } = longestMatchRow;
    const nextHopIdx = (lastUsedNextHopIdx + 1) % nextHops.length;
    const sourceIp = IPv4Address.fromString(nextHops[nextHopIdx].interfaceId);
    const ipInterface = this.ipInterfaces.get(sourceIp.toString());
    if (!ipInterface) {
      console.error(`
        The required IP Interface to send a packet was not found.
        router id ${this.id}, destination ${destination}, next hop ${sourceIp}
      `);
      return;
    }
    longestMatchRow.lastUsedNextHopIdx = nextHopIdx;
    ipInterface.ipInterface.sendMessage(this, ipPacket);
  };

  originateIpPacket = (
    destination: IPv4Address,
    ipProtocol: IPProtocolNumber,
    body: IPacket,
    ipInterfaceId?: string
  ) => {
    if (!this.turnedOn) {
      return;
    }
    if (ipInterfaceId) {
      const { ipInterface } = this.ipInterfaces.get(ipInterfaceId) ?? {};
      const ipHeader = new IPHeader(
        Date.now(),
        ipProtocol,
        IPv4Address.fromString(ipInterfaceId),
        destination
      );
      const ipPacket = new IPPacket(ipHeader, body);
      ipInterface?.sendMessage(this, ipPacket);
      const packetSentEvent = PacketSentEventBuilder(this.id, ipPacket);
      store.dispatch(emitEvent0(packetSentEvent));
      return;
    }
    const longestMatchRow = this.routingTableLookup(destination);
    if (!longestMatchRow) {
      // TODO: Show tooltip.
      console.warn(`Unable to route the message to destination ${destination}`);
      return;
    }
    const { nextHops, lastUsedNextHopIdx } = longestMatchRow;
    const nextHopIdx = (lastUsedNextHopIdx + 1) % nextHops.length;
    const sourceIp = IPv4Address.fromString(nextHops[nextHopIdx].interfaceId);
    const ipHeader = new IPHeader(
      Date.now(),
      ipProtocol,
      sourceIp,
      destination
    );
    longestMatchRow.lastUsedNextHopIdx = nextHopIdx;
    const ipPacket = new IPPacket(ipHeader, body);
    this.sendIpPacket(ipPacket, true);
  };

  receiveIPPacket = (interfaceId: string, packet: IPPacket) => {
    const { header } = packet;
    const { protocol, destination } = header;
    const { receivePacket } = this.ospf;
    if (!this.turnedOn) {
      return;
    }
    const packetAction =
      BROADCAST_ADDRESSES.has(destination.toString()) ||
      this.ipInterfaces.has(destination.toString())
        ? "process"
        : "forward";
    if (packetAction === "process") {
      switch (protocol) {
        case IPProtocolNumber.ospf:
          receivePacket(interfaceId, packet);
          break;
        default:
          console.log(`Received packet ${header.id} from ${header.source}`);
          console.warn(`Cannot handle ${protocol} protocol messages`);
          break;
      }
    } else {
      // forwarding the packet
      packet.header.ttl--; // Decrement the TTL of the received packet
      if (packet.header.ttl <= 0) {
        // Drop the packet. Send ICMP message back to the source that the packet was not deliverable.
        this.dropPacket(packet, "Packet TTL Expired.");
        return;
      }
      this.sendIpPacket(packet);
    }
  };

  dropPacket = (
    packet: IPPacket,
    reason: string,
    color: string = Colors.accent
  ) => {
    const context = window.elementLayer?.getContext("2d");
    const { cellSize } = store.getState();
    const event = PacketDroppedEventBuilder(this, packet, reason);
    store.dispatch(emitEvent0(event));
    context && packetAnimations.packetDrop(context, cellSize, this, 500, color);
  };

  turnOn = () => {
    const { config, lsDb } = this.ospf;
    const { helloInterval } = config;
    if (this.turnedOn === true) {
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
    lsDb.startTimers();
    return { ...this };
  };

  turnOff = async () => {
    this.turnedOn = "turning_off";
    this.ospf.lsDb.clearTimers();
    await this.ospf.lsDb.clearDb(true); //TODO: Make graceful shutdown optional
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
    this.turnedOn = false;
    return { ...this };
  };
}
