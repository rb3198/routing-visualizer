import { IPPacket } from "src/entities/ip/packets";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { OSPFInterface } from "..";

export abstract class PacketHandlerBase<T extends OSPFPacket> {
  protected ospfInterface: OSPFInterface;

  constructor(ospfInterface: OSPFInterface) {
    this.ospfInterface = ospfInterface;
  }

  abstract handle: (interfaceId: string, ipPacket: IPPacket, packet: T) => void;
}
