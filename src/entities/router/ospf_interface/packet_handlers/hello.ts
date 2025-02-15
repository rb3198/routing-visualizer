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
      addToNeighborTable(routerId, areaId, ipSrc, interfaceId);
    }
    neighborStateMachine(routerId.ip, NeighborSMEvent.HelloReceived);
    const presentInNeighborList = neighborList.has(router.id.toString());
    neighborStateMachine(
      routerId.ip,
      presentInNeighborList
        ? NeighborSMEvent.TwoWayReceived
        : NeighborSMEvent.OneWay
    );
    if (!presentInNeighborList) {
      return;
    }
  };
}
