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
import { emitEvent, setLiveNeighborTable } from "src/action_creators";
import { PacketDroppedEvent } from "../../network_event/packet_events/dropped";
import { getIpPacketDropReason } from "./utils";
import { IPPacket } from "src/entities/ip/packets";
import {
  NeighborTableEvent,
  NeighborTableEventType,
} from "src/entities/network_event/neighbor_table_event";
import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import { LSRequest } from "src/entities/ospf/packets/ls_request";
import { LSRequestPacket } from "src/entities/ospf/packets";
import { LsDb } from "./ls_db";
import { LSUpdatePacket } from "src/entities/ospf/packets";
import {
  DDPacketHandler,
  HelloPacketHandler,
  LsRequestPacketHandler,
} from "./packet_handlers";

export class OSPFInterface {
  config: OSPFConfig;
  router: Router;
  neighborTable: Record<string, NeighborTableRow>;
  lsDb: LsDb;
  routingTable: Map<string, RoutingTableRow>;
  packetHandlerFactory: {
    [PacketType.Hello]: HelloPacketHandler;
    [PacketType.DD]: DDPacketHandler;
    [PacketType.LinkStateRequest]: LsRequestPacketHandler;
  };
  constructor(router: Router, config: OSPFConfig) {
    this.router = router;
    this.neighborTable = {};
    this.lsDb = new LsDb(router);
    this.routingTable = new Map();
    this.config = config;
    this.packetHandlerFactory = {
      [PacketType.Hello]: new HelloPacketHandler(this),
      [PacketType.DD]: new DDPacketHandler(this),
      [PacketType.LinkStateRequest]: new LsRequestPacketHandler(this),
    };
  }

  dropPacket = (ipPacket: IPPacket, reason: string) => {
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

  receivePacket = (interfaceId: string, packet: IPPacket) => {
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
      return this.packetHandlerFactory[PacketType.Hello].handle(
        interfaceId,
        packet,
        ospfPacket
      );
    }
    if (!this.neighborTable[packetSource.toString()]) {
      return this.dropPacket(
        packet,
        `Source of the packet is not in the neighbor list of router ${routerId.toString()}`
      );
    }
    switch (packetType) {
      // Add code to handle other types of packets here.
      case PacketType.DD:
        return this.packetHandlerFactory[PacketType.DD].handle(
          interfaceId,
          packet,
          ospfPacket as DDPacket
        );
      case PacketType.LinkStateRequest:
        return this.packetHandlerFactory[PacketType.LinkStateRequest].handle(
          interfaceId,
          packet,
          ospfPacket as LSRequestPacket
        );
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

  /**
   * - Clears the previous interval-based timer to send LS Update packets, if any.
   * - Transmits the list to the neighbor and sets a new interval timer to retransmit if not empty.
   * - Should be called when transmitting the packets in response to LS Request packets, OR
   * Flooding a newly received / originated LSA.
   * @param neighbor
   * @param list
   */
  setNeighborLsRetransmissionList = (
    neighbor: NeighborTableRow,
    list: LSA[]
  ) => {
    const { rxmtInterval } = this.config;
    const { routerId: neighborId, lsRetransmissionRxmtTimer } = neighbor;
    let desc = `No more link state updates to retransmit to neighbor <b>${neighborId}</b>. Retransmission Timer reset.`;
    clearInterval(lsRetransmissionRxmtTimer); // Clear the previous timer.
    let newLsRetransmissionRxmtTimer = undefined;
    if (list.length) {
      desc = `The Link State Retransmission List has been updated for neighbor <b>${neighborId}</b>, since the router just flooded
      Link State Updates to the neighbor. This list will be re-transmitted in case ACK is not received from the neighbor within 
      <i>rxmtInterval</i> seconds`;
      newLsRetransmissionRxmtTimer = setInterval(() => {
        // emitEvent() TODO saying "LS Retransmission Timer for neighbor triggered."
        this.sendLSUpdatePacket(neighborId);
      }, rxmtInterval);
      setTimeout(this.sendLSUpdatePacket.bind(this, neighborId));
    }
    this.setNeighbor(
      {
        ...neighbor,
        linkStateRetransmissionList: list,
        lsRetransmissionRxmtTimer: newLsRetransmissionRxmtTimer,
      },
      desc
    );
  };

  /**
   * - Clears the previous interval-based timer to send LS Request packets, if any.
   * - If the new list is empty, does not set a new timer, and emits an event saying all 'LS Requests satisfied'
   * Else, sets the list and a new timer to request again.
   * - Called by LS Update packet handler in states >= `Loading`, or DD packet handler when state < `Loading`.
   * @param neighbor
   * @param list
   */
  setNeighborLsRequestList = (
    neighbor: NeighborTableRow,
    list: LSAHeader[]
  ) => {
    const { lsRequestRxmtTimer, routerId: neighborId } = neighbor;
    const { rxmtInterval } = this.config;
    clearInterval(lsRequestRxmtTimer);
    let newTimer = undefined;
    let desc = `Router received all the required Link State Adverts required from neighbor ${neighborId}.
    Hence, the router is clearing the Link State Request List.`;
    if (list.length) {
      newTimer = setInterval(
        this.sendLSRequestPacket.bind(this, neighborId),
        rxmtInterval
      );
      desc = `
        Router spotted a new / updated LSA in the area. Updated the Link State Request List for neighbor <b>${neighborId}</b>
        `;
      setTimeout(this.sendLSRequestPacket.bind(this, neighborId));
    }
    this.setNeighbor(
      {
        ...neighbor,
        lsRequestRxmtTimer: newTimer,
        linkStateRequestList: list,
      },
      desc
    );
  };

  addToNeighborTable = (
    routerId: IPv4Address,
    areaId: number,
    ipSrc: IPv4Address,
    interfaceId: string
  ) => {
    const neighbor = new NeighborTableRow(
      routerId,
      areaId,
      State.Down,
      ipSrc,
      interfaceId
    );
    this.lsDb.originateRouterLsa(areaId, true);
    const eventDesc = `Router ${routerId} <i>added to</i> the OSPF Neighbor Table since
    its OSPF config (helloInterval, deadInterval, DR, BDR) matched exactly with the router. 
    It belonged to the same area or the backbone area (Area 0)`;
    this.setNeighbor(neighbor, eventDesc);
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

  private getAreaId = (ipInterface?: IPLinkInterface) => {
    const { areaId } = this.config;
    return ipInterface?.getOppositeRouter(this.router).ospf.config.areaId ===
      BACKBONE_AREA_ID
      ? BACKBONE_AREA_ID
      : areaId;
  };

  sendHelloPacket = (ipInterface: IPLinkInterface) => {
    const { router, config, neighborTable } = this;
    const { helloInterval, deadInterval } = config;
    const { id: routerId } = router;
    const [, , , , subnetMask] = routerId.bytes;
    const neighborList = Object.values(neighborTable).map(
      (neighbor) => neighbor.routerId
    );
    const helloPacket = new HelloPacket(
      router.id,
      this.getAreaId(ipInterface),
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

  sendDDPacket = (neighborId: IPv4Address) => {
    const { router, neighborTable } = this;
    const neighbor = neighborTable[neighborId.toString()];
    if (!neighbor) {
      console.warn("Didn't find the neighbor to send DD Packet to.");
      return;
    }
    const { state, interfaceId, address, areaId } = neighbor;
    if (state < State.ExStart) {
      console.warn(
        "Should not be sending DD packets in states less than ExStart."
      );
      return;
    }
    const { ipInterfaces } = router;
    const { ipInterface } = ipInterfaces.get(interfaceId) ?? {};
    if (state === State.ExStart) {
      if (!neighbor.ddSeqNumber) {
        neighbor.ddSeqNumber = Date.now();
      }
      const ddPacket = new DDPacket(
        this.router.id,
        areaId,
        neighbor.ddSeqNumber,
        true,
        true,
        true,
        []
      );
      ipInterface?.sendMessage(
        router,
        address,
        IPProtocolNumber.ospf,
        ddPacket,
        Colors.dd
      );
    } else {
      const { ddSeqNumber, master } = neighbor;
      const lsaHeaders = this.lsDb
        .getLsaListByArea(areaId)
        .map((lsa) => lsa.header);
      const ddPacket = new DDPacket(
        this.router.id,
        areaId,
        ddSeqNumber,
        false,
        false,
        master,
        lsaHeaders
      );
      ipInterface?.sendMessage(
        router,
        address,
        IPProtocolNumber.ospf,
        ddPacket,
        Colors.dd
      );
    }
  };

  sendLSUpdatePacket = (neighborId: IPv4Address) => {
    const neighbor = this.neighborTable[neighborId.toString()];
    const { id: routerId, ipInterfaces } = this.router;
    if (!neighbor) {
      console.warn("sendLSUpdate called for a neighbor which doesn't exist!");
      return;
    }
    const { interfaceId, address, areaId, linkStateRetransmissionList } =
      neighbor;
    const { ipInterface } = ipInterfaces.get(interfaceId) || {};
    ipInterface?.sendMessage(
      this.router,
      address,
      IPProtocolNumber.ospf,
      new LSUpdatePacket(routerId, areaId, linkStateRetransmissionList),
      Colors.lsUpdate
    );
  };

  sendLSRequestPacket = (neighborId: IPv4Address) => {
    const neighbor = this.neighborTable[neighborId.toString()];
    if (
      !neighbor ||
      !neighbor.linkStateRequestList.length ||
      neighbor.state !== State.Loading
    ) {
      return;
    }
    const { linkStateRequestList, interfaceId, address } = neighbor;
    const { ipInterfaces } = this.router;
    const { ipInterface } = ipInterfaces.get(interfaceId) || {};
    const requests = linkStateRequestList.map((header) =>
      LSRequest.fromLSAHeader(header)
    );
    const lsRequestPacket = new LSRequestPacket(
      this.router.id,
      this.getAreaId(ipInterface),
      requests
    );
    ipInterface?.sendMessage(
      this.router,
      address,
      IPProtocolNumber.ospf,
      lsRequestPacket,
      Colors.lsRequest
    );
  };
}
