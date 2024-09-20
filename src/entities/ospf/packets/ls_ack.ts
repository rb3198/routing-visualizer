import { IPv4Address } from "src/entities/ip/ipv4_address";
import { VERSION } from "../constants";
import { PacketType } from "../enum";
import { LSAHeader } from "../lsa";
import { OSPFHeader } from "./header";
import { OSPFPacket } from "./packet_base";

export class LSAckPacket extends OSPFPacket {
  body: LSAHeader[];
  constructor(routerId: IPv4Address, areaId: number, ackLsaList: LSAHeader[]) {
    const header = new OSPFHeader(
      VERSION,
      PacketType.LinkStateAck,
      routerId,
      areaId
    );
    super(header);
    this.body = ackLsaList;
  }
}
