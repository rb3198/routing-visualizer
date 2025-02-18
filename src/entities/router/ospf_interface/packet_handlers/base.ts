import { IPPacket } from "src/entities/ip/packets";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { OSPFInterface } from "..";
import { PacketProcessedEventBuilder } from "src/entities/network_event/event_builders/packets/processed";
import { store } from "src/store";
import {
  emitEvent,
  openNeighborTableSnapshot,
  openPacketModal,
} from "src/action_creators";
import { copyNeighborTable } from "src/utils/common";

export abstract class PacketHandlerBase<T extends OSPFPacket> {
  protected ospfInterface: OSPFInterface;
  packetProcessedEventBuilder?: ReturnType<typeof PacketProcessedEventBuilder>;

  constructor(ospfInterface: OSPFInterface) {
    this.ospfInterface = ospfInterface;
  }

  protected abstract _handle: (
    interfaceId: string,
    ipPacket: IPPacket,
    packet: T
  ) => void;

  handle(interfaceId: string, ipPacket: IPPacket, packet: T) {
    const { router } = this.ospfInterface;
    const { id } = router;
    const prevTable = copyNeighborTable(this.ospfInterface.neighborTable);
    this.packetProcessedEventBuilder = PacketProcessedEventBuilder(
      id,
      ipPacket
    );
    this._handle(interfaceId, ipPacket, packet);
    const table = copyNeighborTable(this.ospfInterface.neighborTable);
    // Build links using previous and current tables.
    this.packetProcessedEventBuilder.addLink({
      label: "View Packet",
      onClick: () => {
        store.dispatch(openPacketModal(ipPacket));
      },
    });
    this.packetProcessedEventBuilder.addLink({
      label: "View Neighbor Table Snapshot",
      onClick: () => {
        store.dispatch(
          openNeighborTableSnapshot({
            prevTable,
            table,
            routerId: id,
            timestamp: Date.now(),
          })
        );
      },
    });
    store.dispatch(emitEvent(this.packetProcessedEventBuilder()));
    this.packetProcessedEventBuilder = undefined;
  }
}
