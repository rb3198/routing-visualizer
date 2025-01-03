import { IPv4Address } from "src/entities/ip/ipv4_address";
import { VERSION } from "../constants";
import { PacketType } from "../enum";
import { LSA } from "../lsa";
import { OSPFHeader } from "./header";
import { OSPFPacket } from "./packet_base";
import { store } from "src/store";
import { MaxAge } from "../lsa/constants";
import { copyLsa } from "src/utils/common";

export class LSUpdatePacketBody {
  nLsa: number;
  lsaList: LSA[];
  constructor(lsaList: LSA[]) {
    const { propagationDelay } = store.getState();
    this.lsaList = lsaList.map((lsa) => {
      const newLsa = copyLsa(lsa);
      const { header } = newLsa;
      const { lsAge } = header;
      // Age all the LSAs by InfTransDelay (animation delay) before sending them on the link
      header.lsAge = Math.min(
        MaxAge,
        lsAge + Math.round(propagationDelay / 1000)
      );
      return newLsa;
    });
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
