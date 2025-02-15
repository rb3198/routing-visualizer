import { IPPacket } from "src/entities/ip/packets";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { OSPFInterface } from "..";
import { PacketProcessedEventBuilder } from "src/entities/network_event/event_builders/packets/processed";
import { store } from "src/store";
import { emitEvent0 } from "src/action_creators";

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
    // const prevTable = {
    //   ...this.ospfInterface.neighborTable,
    // }; TODO
    this.packetProcessedEventBuilder = PacketProcessedEventBuilder(
      id,
      ipPacket
    );
    this._handle(interfaceId, ipPacket, packet);
    // const curTable = {
    //   ...this.ospfInterface.neighborTable,
    // }; TODO
    // record curTable in links
    this.packetProcessedEventBuilder.addLink({
      label: "View Neighbor Table Snapshot",
      onClick: () => {},
    }); // TODO
    store.dispatch(emitEvent0(this.packetProcessedEventBuilder()));
    this.packetProcessedEventBuilder = undefined;
  }
}
