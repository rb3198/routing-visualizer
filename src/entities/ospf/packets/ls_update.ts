import { IPv4Address } from "src/entities/ip/ipv4_address";
import { VERSION } from "../constants";
import { PacketType } from "../enum";
import { LSA } from "../lsa";
import { OSPFHeader } from "./header";
import { OSPFPacket } from "./packet_base";

export class LSUpdatePacketBody {
  nLsa: number;
  lsaList: LSA[];
  constructor(lsaList: LSA[]) {
    this.lsaList = lsaList;
    this.nLsa = lsaList.length;
  }
}

export class LSUpdatePacket extends OSPFPacket {
  body: LSUpdatePacketBody;
  constructor(routerId: IPv4Address, areaId: number, lsaList: LSA[]) {
    const header = new OSPFHeader(
      VERSION,
      PacketType.LinkStateUpdate,
      routerId,
      areaId
    );
    super(header);
    this.body = new LSUpdatePacketBody(lsaList);
  }
}
