import { OSPFPacket } from "../../ospf/packets/packet_base";
import {
  NetworkEventBase,
  NetworkEventCallback,
  NetworkEventLink,
} from "../base";
import { NetworkEventType } from "../network_event_type";

export abstract class PacketEvent extends NetworkEventBase {
  packet: OSPFPacket;
  constructor(
    packet: OSPFPacket,
    links: NetworkEventLink[],
    callback?: NetworkEventCallback
  ) {
    super(NetworkEventType.packet, links, callback);
    this.packet = packet;
  }
}
