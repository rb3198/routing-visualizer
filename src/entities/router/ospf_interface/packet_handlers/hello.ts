import { IPPacket } from "src/entities/ip/packets";
import { PacketHandlerBase } from ".";
import { HelloPacket } from "src/entities/ospf/packets";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";

export class HelloPacketHandler extends PacketHandlerBase<HelloPacket> {
  /**
   * Checks if the router should process the hello packet.
   *
   * A hello packet should be processed only if all the network params match.
   * @param packet
   */
  private shouldProcessHelloPacket = (packet: HelloPacket) => {
    const { config, router } = this.ospfInterface;
    const { body } = packet;
    const { helloInterval, deadInterval, networkMask } = body;
    const [, , , , routerMask] = router.id.bytes;
    return (
      helloInterval === config.helloInterval &&
      deadInterval === config.deadInterval &&
      networkMask === routerMask
    );
  };

  _handle = (interfaceId: string, ipPacket: IPPacket, packet: HelloPacket) => {
    const { header: ipHeader } = ipPacket;
    const { source: ipSrc } = ipHeader;
    const { header, body } = packet;
    const { neighborList } = body;
    const { routerId, areaId } = header;
    const {
      neighborTable,
      dropPacket,
      addToNeighborTable,
      neighborStateMachine,
      router,
    } = this.ospfInterface;
    if (!this.shouldProcessHelloPacket(packet)) {
      return dropPacket(ipPacket, "Hello packet config mismatch.");
    }
    // Router ID is derived from the router ID contained in the OSPF Header.
    if (!neighborTable[routerId.ip]) {
      this.packetProcessedEventBuilder
        ?.addAction(`Router ${routerId} <i>added to</i> the OSPF Neighbor Table since
    its OSPF config (helloInterval, deadInterval, DR, BDR) matched exactly with the router. 
    It belonged to the same area or the backbone area (Area 0)`);
      addToNeighborTable(routerId, areaId, ipSrc, interfaceId);
    }
    const helloReceivedAction = neighborStateMachine(
      routerId.ip,
      NeighborSMEvent.HelloReceived
    );
    helloReceivedAction &&
      this.packetProcessedEventBuilder?.addAction(helloReceivedAction);
    const presentInNeighborList = neighborList.has(router.id.toString());
    const directionAction = neighborStateMachine(
      routerId.ip,
      presentInNeighborList
        ? NeighborSMEvent.TwoWayReceived
        : NeighborSMEvent.OneWay
    );
    directionAction &&
      this.packetProcessedEventBuilder?.addAction(directionAction);
    if (!presentInNeighborList) {
      return;
    }
  };
}
