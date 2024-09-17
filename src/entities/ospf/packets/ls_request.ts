import { IPv4Address } from "src/entities/ip/ipv4_address";
import { VERSION } from "../constants";
import { LSType, PacketType } from "../enum";
import { OSPFHeader } from "./header";
import { OSPFPacket } from "./packet_base";

export class LSRequest {
  lsType: LSType;
  linkStateId: IPv4Address;
  advertisingRouter: IPv4Address;
  constructor(
    lsType: LSType,
    linkStateId: IPv4Address,
    advertisingRouter: IPv4Address
  ) {
    this.lsType = lsType;
    this.linkStateId = linkStateId;
    this.advertisingRouter = advertisingRouter;
  }
}

export class LSRequestPacket extends OSPFPacket {
  body: LSRequest[];
  constructor(routerId: IPv4Address, areaId: number, requests: LSRequest[]) {
    const header = new OSPFHeader(
      VERSION,
      PacketType.LinkStateRequest,
      routerId,
      areaId
    );
    super(header);
    this.body = requests;
  }
}
