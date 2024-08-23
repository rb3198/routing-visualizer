import { IPv4Address } from "../../ip/ipv4_address";
import { VERSION } from "../constants";
import { PacketType } from "../enum";
import { LSAHeader } from "../lsa";
import { OSPFHeader } from "./header";
import { OSPFPacket } from "./packet_base";

export class DDPacketBody {
  ddSeqNumber: number;
  /**
   * The Init bit.  When set to 1, this packet is the first in the sequence of Database Description Packets.
   */
  init: boolean;
  /**
   * The More bit.  When set to 1, it indicates that more Database Description Packets are to follow.
   */
  m: boolean;
  /**
   * The Master/Slave bit.  When set to 1, it indicates that the router is the master during the Database Exchange process.
    Otherwise, the router is the slave.
   */
  master: boolean;
  lsaList: LSAHeader[];
  constructor(
    ddSeqNumber?: number,
    init?: boolean,
    m?: boolean,
    master?: boolean,
    lsaList?: LSAHeader[]
  ) {
    this.ddSeqNumber = ddSeqNumber ?? 0;
    this.init = init ?? false;
    this.m = m ?? false;
    this.master = master ?? false;
    this.lsaList = lsaList ?? [];
  }
}

export class DDPacket extends OSPFPacket {
  body: DDPacketBody;
  constructor(
    routerId: IPv4Address,
    areaId: number,
    ddSeqNumber?: number,
    init?: boolean,
    m?: boolean,
    master?: boolean,
    lsaList?: LSAHeader[]
  ) {
    const header = new OSPFHeader(VERSION, PacketType.DD, routerId, areaId);
    super(header);
    this.body = new DDPacketBody(ddSeqNumber, init, m, master, lsaList);
  }
}
