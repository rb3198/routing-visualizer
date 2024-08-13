import { Router } from "..";
import { IPv4Address } from "../../ip/ipv4_address";
import { IPProtocolNumber } from "../../ip/enum/ip_protocol_number";
import { OSPFConfig } from "../../ospf/config";
import { PacketType, State } from "../../ospf/enum";
import { NeighborSMEvent } from "../../ospf/enum/state_machine_events";
import { HelloPacket } from "../../ospf/packets";
import { OSPFHeader } from "../../ospf/packets/header";
import { HelloPacketBody } from "../../ospf/packets/hello_packet";
import { OSPFPacket } from "../../ospf/packets/packet_base";
import { NeighborTableRow, RoutingTableRow } from "../../ospf/tables";
import { helloReceived } from "./neighbor_event_handlers";

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
    const { deadInterval } = body;
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
      return this.neighborStateMachine(
        routerId.ip,
        NeighborSMEvent.HelloReceived
      );
    }
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

  private neighborStateMachine = (
    neighborId: string,
    event: NeighborSMEvent
  ): void => {
    const { neighborTable } = this;
    const neighbor = neighborTable.get(neighborId);
    if (!neighbor) {
      console.warn(
        `Neighbor state machine called with neighbor ID ${neighborId}, which was not found in the neighbor table.`
      );
      return;
    }
    switch (event) {
      case NeighborSMEvent.HelloReceived:
        helloReceived.call(this, neighbor);
        break;
      default:
        break;
    }
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
      new OSPFHeader(1, PacketType.Hello, router.id, areaId),
      new HelloPacketBody(
        0 /* Network mask TODO */,
        helloInterval,
        deadInterval,
        neighborList
      )
    );
    const ipInterface = ipInterfaces.get(interfaceId);
    ipInterface?.sendMessage(
      router,
      address,
      IPProtocolNumber.ospf,
      helloPacket
    );
  };
}
