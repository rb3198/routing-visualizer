import { IPv4Address } from "../../ip/ipv4_address";
import { VERSION } from "../constants";
import { PacketType } from "../enum";
import { OSPFHeader } from "./header";
import { OSPFPacket } from "./packet_base";

/**
 * Simplified representation of a hello OSPF packet.
 *
 * DR, BDR, Options, Router Priority fields are omitted.
 */
export class HelloPacketBody {
  networkMask: number;
  /**
   * The interval at which hello packets are sent.
   */
  helloInterval: number;
  /**
   * Dead interval of the network, in ms.
   * Any neighbor from which hello packets haven't been received within this interval is considered as dead by its neighbors.
   */
  deadInterval: number;
  /**
   * List of the router's neighbors.
   */
  neighborList: Set<string>;
  constructor(
    networkMask: number,
    helloInterval: number,
    deadInterval: number,
    neighborList: IPv4Address[]
  ) {
    this.networkMask = networkMask;
    this.helloInterval = helloInterval;
    this.deadInterval = deadInterval;
    this.neighborList = new Set(neighborList.map((neighbor) => neighbor.ip));
  }
}

export class HelloPacket extends OSPFPacket {
  body: HelloPacketBody;
  constructor(
    routerId: IPv4Address,
    areaId: string,
    networkMask: number,
    helloInterval: number,
    deadInterval: number,
    neighborList?: IPv4Address[]
  ) {
    const header = new OSPFHeader(VERSION, PacketType.Hello, routerId, areaId);
    const body = new HelloPacketBody(
      networkMask,
      helloInterval,
      deadInterval,
      neighborList ?? []
    );
    super(header);
    this.body = body;
  }
}
