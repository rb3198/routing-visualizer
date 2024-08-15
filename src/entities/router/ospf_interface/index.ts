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

export class OSPFInterface {
  config: OSPFConfig;
  router: Router;
  neighborTable: Map<string, NeighborTableRow>;
  routingTable: Map<string, RoutingTableRow>;
  constructor(router: Router, config: OSPFConfig) {
    this.router = router;
    this.neighborTable = new Map();
    this.routingTable = new Map();
    this.config = config;
  }

  receivePacket = (
    interfaceId: string,
    ipSrc: IPv4Address,
    packet: OSPFPacket
  ) => {
    const { header } = packet;
    const { type: packetType } = header;
    switch (packetType) {
      case PacketType.Hello:
        if (!(packet instanceof HelloPacket)) {
          console.error("Expected Hello Packet");
          return;
        }
        this.helloPacketHandler(ipSrc, interfaceId, packet);
        break;
      default:
        break;
    }
  };

  helloPacketHandler = (
    ipSrc: IPv4Address,
    interfaceId: string,
    packet: HelloPacket
  ) => {
    const { header, body } = packet;
    const { deadInterval, neighborList } = body;
    const { routerId } = header;
    const { neighborTable } = this;
    if (!this.shouldProcessHelloPacket(packet)) {
      return;
    }
    // Router ID is derived from the router ID contained in the OSPF Header.
    if (!neighborTable.has(routerId.ip)) {
      neighborTable.set(
        routerId.ip,
        new NeighborTableRow(
          routerId,
          State.Down,
          Date.now() + deadInterval,
          ipSrc,
          interfaceId
        )
      );
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
    const neighbor = neighborTable.get(neighborId);
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

  sendHelloPacket = (neighbor: NeighborTableRow) => {
    const { router, config, neighborTable } = this;
    const { areaId, helloInterval, deadInterval } = config;
    const { ipInterfaces } = router;
    const { interfaceId, address } = neighbor;
    const neighborList = [...neighborTable.values()].map(
      (neighbor) => neighbor.routerId
    );
    const helloPacket = new HelloPacket(
      router.id,
      areaId,
      0, // Network Mask TODO
      helloInterval,
      deadInterval,
      neighborList
    );
    const ipInterface = ipInterfaces.get(interfaceId);
    ipInterface?.sendMessage(
      router,
      address,
      IPProtocolNumber.ospf,
      helloPacket
    );
  };

  sendDDPacket = (neighbor: NeighborTableRow) => {
    const { config, router } = this;
    const { areaId } = config;
    const { state, interfaceId, address, ddSeqNumber } = neighbor;
    const { ipInterfaces } = router;
    const ipInterface = ipInterfaces.get(interfaceId);
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
