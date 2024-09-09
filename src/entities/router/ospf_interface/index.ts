import { Router } from "..";
import { IPv4Address } from "../../ip/ipv4_address";
import { IPProtocolNumber } from "../../ip/enum/ip_protocol_number";
import { OSPFConfig } from "../../ospf/config";
import { PacketType, State } from "../../ospf/enum";
import { NeighborSMEvent } from "../../ospf/enum/state_machine_events";
import { DDPacket, HelloPacket } from "../../ospf/packets";
import { OSPFPacket } from "../../ospf/packets/packet_base";
import { NeighborTableRow, RoutingTableRow } from "../../ospf/tables";
import neighborEventHandlerFactory from "./neighbor_event_handlers";
import { IPAddresses } from "../../../constants/ip_addresses";
import { IPLinkInterface } from "../../ip/link_interface";
import { BACKBONE_AREA_ID, VERSION } from "../../ospf/constants";
import { Colors } from "../../../constants/theme";
import { store } from "../../../store";
import { emitEvent, setLiveNeighborTable } from "../../../action_creators";
import { PacketDroppedEvent } from "../../network_event/packet_events/dropped";
import { getIpPacketDropReason } from "./utils";
import { IPPacket } from "src/entities/ip/packets";
import {
  NeighborTableEvent,
  NeighborTableEventType,
} from "src/entities/network_event/neighbor_table_event";

export class OSPFInterface {
  config: OSPFConfig;
  router: Router;
  neighborTable: Record<string, NeighborTableRow>;
  routingTable: Map<string, RoutingTableRow>;
  constructor(router: Router, config: OSPFConfig) {
    this.router = router;
    this.neighborTable = {};
    this.routingTable = new Map();
    this.config = config;
  }

  dropPacket = (ipPacket: IPPacket, reason: string) => {
    const { header } = ipPacket;
    const { id } = header;
    console.log(
      `Packet with ID ${id} dropped by router ${this.router.id.toString()}`
    );
    const event = new PacketDroppedEvent(this.router, ipPacket, reason);
    emitEvent({
      eventName: "packetDropped",
      event,
      viz: {
        color: Colors.droppedPacket,
        duration: 1000,
        context: window.elementLayer?.getContext("2d"),
      },
    })(store.dispatch);
  };

  /**
   * Decides whether a received packet must be processed, as per section 8.2 of the spec.
   * @param ipPacketId The IP ID of the packet.
   * @param packet The OSPF Packet
   * @returns
   */
  shouldReceiveIpPacket = (ipPacketId: number, packet: OSPFPacket) => {
    const { router, config } = this;
    const { areaId } = config;
    const { header } = packet;
    const { areaId: srcAreaId, routerId: packetSource, version } = header;
    const versionOk = version === VERSION;
    const sourceOk = !router.id.equals(packetSource); // The Hello packet originated from this router itself.
    const areaIdOk = srcAreaId === areaId || srcAreaId === BACKBONE_AREA_ID; // Optionally add virtual link check if you implement virtual links
    console.log(
      `For packet ID ${ipPacketId} received by router ${this.router.id.toString()}`
    );
    console.log(
      `VersionOK = ${versionOk}, SourceOK = ${sourceOk}, AreaOK = ${areaIdOk}`
    );
    let reason = "";
    const ok = versionOk && sourceOk && areaIdOk;
    if (!ok) {
      reason = getIpPacketDropReason.call(this, versionOk, sourceOk, areaIdOk);
    }
    return { ok, reason };
  };

  receivePacket = (
    interfaceId: string,
    ipSrc: IPv4Address,
    packet: IPPacket
  ) => {
    if (!(packet.body instanceof OSPFPacket)) {
      throw new Error("OSPF Packet expected to be received on OSPF Interface");
    }
    const { id: routerId } = this.router;
    const { header: ipHeader, body: ospfPacket } = packet;
    const { id: ipPacketId } = ipHeader;
    const { header } = ospfPacket;
    const { type: packetType, routerId: packetSource } = header;
    const { ok: packetOk, reason } = this.shouldReceiveIpPacket(
      ipPacketId,
      ospfPacket
    );
    if (!packetOk) {
      return this.dropPacket(packet, reason);
    }
    if (packetType === PacketType.Hello) {
      if (!(ospfPacket instanceof HelloPacket)) {
        console.error("Expected Hello Packet");
        return;
      }
      return this.helloPacketHandler(packet, ipSrc, interfaceId, ospfPacket);
    }
    if (!this.neighborTable[packetSource.toString()]) {
      console.log(
        `Dropping packet with ID ${ipPacketId} since the source is not in the neighbor list of router ${routerId.toString()}`
      );
      return this.dropPacket(
        packet,
        `Source of the packet is not in the neighbor list of router ${routerId.toString()}`
      );
    }
    switch (packetType) {
      // Add code to handle other types of packets here.
      default:
        break;
    }
  };

  setNeighbor = (neighbor: NeighborTableRow, description: string) => {
    const { modalState } = store.getState();
    const { active, data } = modalState;
    const prevTable = {
      ...this.neighborTable,
    };
    const eventType: NeighborTableEventType = prevTable[
      neighbor.routerId.toString()
    ]
      ? "column_updated"
      : "added";
    this.neighborTable = {
      ...this.neighborTable,
      [neighbor.routerId.toString()]: neighbor,
    };
    emitEvent({
      eventName: "neighborTableEvent",
      event: new NeighborTableEvent(
        Date.now(),
        prevTable,
        this.router,
        neighbor.routerId.toString(),
        eventType,
        description
      ),
    })(store.dispatch);
    if (
      active === "neighbor_table_live" &&
      data.routerId.equals(this.router.id)
    ) {
      // Current Router's Neighbor Table is the one being shown live
      store.dispatch(setLiveNeighborTable(this.router.id, this.neighborTable));
    }
  };

  private addToNeighborTable = (
    routerId: IPv4Address,
    ipSrc: IPv4Address,
    interfaceId: string
  ) => {
    const neighbor = new NeighborTableRow(
      routerId,
      State.Down,
      ipSrc,
      interfaceId
    );
    const eventDesc = `Router ${routerId} <i>added to</i> the OSPF Neighbor Table since
    its OSPF config (helloInterval, deadInterval, DR, BDR) matched exactly with the router. 
    It belonged to the same area or the backbone area (Area 0)`;
    this.setNeighbor(neighbor, eventDesc);
  };

  helloPacketHandler = (
    ipPacket: IPPacket,
    ipSrc: IPv4Address,
    interfaceId: string,
    packet: HelloPacket
  ) => {
    const { header, body } = packet;
    const { neighborList } = body;
    const { routerId } = header;
    const { neighborTable } = this;
    if (!this.shouldProcessHelloPacket(packet)) {
      return this.dropPacket(ipPacket, "Hello packet config mismatch.");
    }
    // Router ID is derived from the router ID contained in the OSPF Header.
    if (!neighborTable[routerId.ip]) {
      this.addToNeighborTable(routerId, ipSrc, interfaceId);
    }
    this.neighborStateMachine(routerId.ip, NeighborSMEvent.HelloReceived);
    const presentInNeighborList = neighborList.has(this.router.id.toString());
    this.neighborStateMachine(
      routerId.ip,
      presentInNeighborList
        ? NeighborSMEvent.TwoWayReceived
        : NeighborSMEvent.OneWay
    );
    if (!presentInNeighborList) {
      return;
    }
    /*
    Potential TODO:
    Create Interface State Machine, and Handle change in neighbor's router Priority Field.
    */
  };

  /**
   * Checks if the router should process the hello packet.
   *
   * A hello packet should be processed only if all the network params match.
   * @param packet
   */
  private shouldProcessHelloPacket = (packet: HelloPacket) => {
    const { config, router } = this;
    const { body } = packet;
    const { helloInterval, deadInterval, networkMask } = body;
    const [, , , , routerMask] = router.id.bytes;
    return (
      helloInterval === config.helloInterval &&
      deadInterval === config.deadInterval &&
      networkMask === routerMask
    );
  };

  neighborStateMachine = (neighborId: string, event: NeighborSMEvent): void => {
    const { neighborTable } = this;
    const neighbor = neighborTable[neighborId];
    if (!neighbor) {
      console.warn(
        `Neighbor state machine called with neighbor ID ${neighborId}, which was not found in the neighbor table.`
      );
      return;
    }
    const eventHandler = neighborEventHandlerFactory.get(event);
    eventHandler && eventHandler.call(this, neighbor);
  };

  onOspfNeighborDown = () => {
    /*
      Generate and flood a new Router LSA.
      Run the SPF algorithm to recalculate the topology.
      Update the routing table.
      Potentially trigger a DR/BDR election.
      Terminate adjacencies with the downed neighbor.
    */
  };

  sendHelloPacket = (ipInterface: IPLinkInterface) => {
    const { router, config, neighborTable } = this;
    const { areaId, helloInterval, deadInterval } = config;
    const { id: routerId } = router;
    const [, , , , subnetMask] = routerId.bytes;
    const neighborList = Object.values(neighborTable).map(
      (neighbor) => neighbor.routerId
    );
    const helloPacket = new HelloPacket(
      router.id,
      ipInterface.getOppositeRouter(this.router).ospf.config.areaId ===
      BACKBONE_AREA_ID
        ? BACKBONE_AREA_ID
        : areaId,
      subnetMask ?? 0,
      helloInterval,
      deadInterval,
      neighborList
    );
    ipInterface?.sendMessage(
      router,
      IPAddresses.OSPFBroadcast,
      IPProtocolNumber.ospf,
      helloPacket,
      Colors.helloPacket
    );
  };

  sendDDPacket = (neighbor: NeighborTableRow) => {
    const { config, router } = this;
    const { areaId } = config;
    const { state, interfaceId, address, ddSeqNumber } = neighbor;
    const { ipInterfaces } = router;
    const { ipInterface } = ipInterfaces.get(interfaceId) ?? {};
    if (state === State.ExStart) {
      const ddPacket = new DDPacket(
        this.router.id,
        areaId,
        ddSeqNumber ? ddSeqNumber + 1 : Date.now(),
        true,
        true,
        true,
        []
      );
      ipInterface?.sendMessage(
        router,
        address,
        IPProtocolNumber.ospf,
        ddPacket
      );
    }
    /*
    TODO: Send complete DD packets in Exchange state.
    */
  };
}
