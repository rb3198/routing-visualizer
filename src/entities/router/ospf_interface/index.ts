import { Router } from "..";
import { IPv4Address } from "../../ip/ipv4_address";
import { IPProtocolNumber } from "../../ip/enum/ip_protocol_number";
import { OSPFConfig } from "../../ospf/config";
import { PacketType, State } from "../../ospf/enum";
import { NeighborSMEvent } from "../../ospf/enum/state_machine_events";
import { DDPacket, HelloPacket } from "../../ospf/packets";
import { OSPFPacket } from "../../ospf/packets/packet_base";
import { NeighborTableRow } from "../../ospf/table_rows";
import neighborEventHandlerFactory from "./neighbor_event_handlers";
import { IPAddresses } from "../../../constants/ip_addresses";
import { IPLinkInterface } from "../../ip/link_interface";
import { BACKBONE_AREA_ID, VERSION } from "../../ospf/constants";
import { Colors } from "../../../constants/theme";
import { store } from "../../../store";
import { setLiveNeighborTable } from "src/action_creators";
import { getIpPacketDropReason } from "./utils";
import { IPPacket } from "src/entities/ip/packets";
import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import { LSRequest } from "src/entities/ospf/packets/ls_request";
import { LSRequestPacket } from "src/entities/ospf/packets";
import { LsDb } from "./ls_db";
import { LSUpdatePacket } from "src/entities/ospf/packets";
import {
  DDPacketHandler,
  HelloPacketHandler,
  LsRequestPacketHandler,
  LsUpdatePacketHandler,
  LsAckPacketHandler,
} from "./packet_handlers";
import { LSAckPacket } from "src/entities/ospf/packets/ls_ack";
import { RoutingTableManager } from "./routing_table";

export class OSPFInterface {
  config: OSPFConfig;
  router: Router;
  neighborTable: Record<string, NeighborTableRow>;
  lsDb: LsDb;
  routingTableManager: RoutingTableManager;
  packetHandlerFactory: {
    [PacketType.Hello]: HelloPacketHandler;
    [PacketType.DD]: DDPacketHandler;
    [PacketType.LinkStateRequest]: LsRequestPacketHandler;
    [PacketType.LinkStateUpdate]: LsUpdatePacketHandler;
    [PacketType.LinkStateAck]: LsAckPacketHandler;
  };
  constructor(router: Router, config: OSPFConfig) {
    this.router = router;
    this.neighborTable = {};
    this.routingTableManager = new RoutingTableManager(this);
    this.config = config;
    this.packetHandlerFactory = {
      [PacketType.Hello]: new HelloPacketHandler(this),
      [PacketType.DD]: new DDPacketHandler(this),
      [PacketType.LinkStateRequest]: new LsRequestPacketHandler(this),
      [PacketType.LinkStateUpdate]: new LsUpdatePacketHandler(this),
      [PacketType.LinkStateAck]: new LsAckPacketHandler(this),
    };
    this.lsDb = new LsDb(this);
  }

  dropPacket = (ipPacket: IPPacket, reason?: string) =>
    this.router.dropPacket(ipPacket, reason, Colors.droppedPacket);

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
    return this.packetHandlerFactory[packetType].handle(
      interfaceId,
      packet,
      // @ts-ignore
      ospfPacket
    );
  };

  setNeighbor = (neighbor: NeighborTableRow) => {
    const { modalState } = store.getState();
    const { active, data } = modalState;
    const { routerId: neighborId } = neighbor;
    const prevNeighbor = this.neighborTable[neighborId.toString()];
    prevNeighbor &&
      neighbor &&
      Object.keys(prevNeighbor).forEach((key) => {
        // @ts-ignore
        prevNeighbor[key] = neighbor[key];
      });
    this.neighborTable[neighbor.routerId.toString()] = neighbor;
    if (
      active === "neighbor_table_live" &&
      data.routerId.equals(this.router.id)
    ) {
      // Current Router's Neighbor Table is the one being shown live
      store.dispatch(setLiveNeighborTable(this.router.id, this.neighborTable));
    }
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
    const { routerId: neighborId } = neighbor;
    let desc = `Router received all the required Link State Adverts required from neighbor ${neighborId}.
    Hence, the router is clearing the Link State Request List.`;
    if (list.length) {
      desc = `
        Router spotted a new / updated LSA in the area. Updated the Link State Request List for neighbor <b>${neighborId}</b>
        `;
    }
    this.setNeighbor({
      ...neighbor,
      linkStateRequestList: list,
    });
    return desc;
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
    !this.lsDb.getLsaListByArea(areaId).length &&
      this.lsDb.originateRouterLsa(areaId);
    this.setNeighbor(neighbor);
  };

  neighborStateMachine = (
    neighborId: string,
    event: NeighborSMEvent,
    reason?: string
  ): string | undefined => {
    const { neighborTable } = this;
    const neighbor = neighborTable[neighborId];
    if (!neighbor) {
      console.warn(
        `Neighbor state machine called with neighbor ID ${neighborId}, which was not found in the neighbor table.`
      );
      return;
    }
    const eventHandler = neighborEventHandlerFactory.get(event);
    return eventHandler && eventHandler.call(this, neighbor, reason);
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
    const { ipInterfaces } = router;
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
    const sourceIp = ipInterface.getSelfIpAddress(router);
    if (sourceIp && ipInterfaces.has(sourceIp)) {
      router.originateIpPacket(
        IPAddresses.OSPFBroadcast,
        IPProtocolNumber.ospf,
        helloPacket,
        sourceIp
      );
    } else {
      setTimeout(() => {
        this.sendHelloPacket(ipInterface);
      });
    }
  };

  sendDDPacket = (neighborId: IPv4Address) => {
    const { router, neighborTable, config } = this;
    const { MaxAge } = config;
    const { simulationConfig } = store.getState();
    const { propagationDelay } = simulationConfig;
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
      router.originateIpPacket(
        address,
        IPProtocolNumber.ospf,
        ddPacket,
        interfaceId
      );
    } else {
      const { ddSeqNumber, master } = neighbor;
      const lsaHeaders = this.lsDb.getLsaListByArea(areaId).map((lsa) => {
        const copy = LSAHeader.from(lsa.header);
        copy.lsAge = Math.min(
          MaxAge,
          copy.lsAge + Math.round(propagationDelay / 1000)
        );
        return copy;
      });
      const ddPacket = new DDPacket(
        this.router.id,
        areaId,
        ddSeqNumber,
        false,
        false,
        master,
        lsaHeaders
      );
      router.originateIpPacket(
        address,
        IPProtocolNumber.ospf,
        ddPacket,
        interfaceId
      );
    }
  };

  private sendLsUpdatePacket = (neighborId: IPv4Address) => {
    const neighbor = this.neighborTable[neighborId.toString()];
    const { id: routerId } = this.router;
    const { rxmtInterval } = this.config;
    if (!neighbor) {
      console.warn("sendLSUpdate called for a neighbor which doesn't exist!");
      return;
    }
    const {
      areaId,
      interfaceId,
      linkStateRetransmissionList,
      lsTransmission,
      address,
    } = neighbor;
    clearTimeout(lsTransmission?.delayTimer);
    clearTimeout(lsTransmission?.rxmtTimer);
    const toSend: LSA[] = [];
    const reasons = new Set<string>();
    for (const d of linkStateRetransmissionList.values()) {
      const { lsa, reason, sentOn } = d;
      if (Date.now() - sentOn >= rxmtInterval) {
        toSend.push(lsa);
        reasons.add(reason);
        d.sentOn = Date.now();
        d.reason =
          "Some LSA(s) retransmitted since <code>RxmtInterval</code> seconds passed.";
      }
    }
    if (!toSend.length) {
      this.setNeighbor({
        ...neighbor,
        lsTransmission: undefined,
      });
      return;
    }
    this.router.originateIpPacket(
      address,
      IPProtocolNumber.ospf,
      new LSUpdatePacket(routerId, areaId, toSend),
      interfaceId,
      Array.from(reasons)
    );
    this.setNeighbor({
      ...neighbor,
      lsTransmission: {
        delayTimer: undefined,
        rxmtTimer: setTimeout(
          () => this.sendLsUpdatePacket(neighborId),
          rxmtInterval
        ),
      },
    });
  };

  private getReleaseDelay = () => {
    const { simulationConfig } = store.getState();
    const { propagationDelay } = simulationConfig;
    return (propagationDelay * 2) / 3;
  };

  scheduleLsuTransmission = (neighborId: IPv4Address) => {
    const neighbor = this.neighborTable[neighborId.toString()];
    if (!neighbor) {
      console.warn("sendLSUpdate called for a neighbor which doesn't exist!");
      return;
    }
    const { lsTransmission } = neighbor;
    const releaseDelay = this.getReleaseDelay();
    if (lsTransmission) {
      // transmission is already scheduled.
      const { rxmtTimer, delayTimer } = lsTransmission;
      clearTimeout(delayTimer);
      clearTimeout(rxmtTimer);
    }
    const delayTimer = setTimeout(
      () => this.sendLsUpdatePacket(neighborId),
      releaseDelay
    );
    this.setNeighbor({
      ...neighbor,
      lsTransmission: {
        delayTimer,
        rxmtTimer: undefined,
      },
    });
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
    this.router.originateIpPacket(
      address,
      IPProtocolNumber.ospf,
      lsRequestPacket,
      interfaceId
    );
  };

  sendLSAckPacket = (
    neighborId: IPv4Address,
    acknowledgements: LSAHeader[]
  ) => {
    const neighbor = this.neighborTable[neighborId.toString()];
    const { interfaceId, areaId, address } = neighbor || {};
    if (!neighbor) {
      return;
    }
    this.router.originateIpPacket(
      address,
      IPProtocolNumber.ospf,
      new LSAckPacket(this.router.id, areaId, acknowledgements),
      interfaceId
    );
  };
}
