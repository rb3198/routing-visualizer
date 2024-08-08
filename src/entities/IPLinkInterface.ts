import { IPProtocolNumber } from "./ip/enum/ip_protocol_number";
import { IPv4Address } from "./ip/ipv4_address";
import { TwoWayMap } from "../utils/two_way_map";
import { IPacket } from "./interfaces/IPacket";
import { ospfMessageHandler } from "./message_handlers/ospf_message_handler";
import { Router } from "./router";

/**
 * The Network layer (IP) link between two routers. Supports sending and receiving network layer IP Messages.
 */
export class IPLinkInterface {
  id: string;
  routers: TwoWayMap<string, Router>;
  baseIp: IPv4Address;
  constructor(id: string, baseIp: IPv4Address, routers?: Router[]) {
    this.id = id;
    this.baseIp = baseIp;
    this.routers = new TwoWayMap();
    this.assignIps(routers);
  }

  private assignIps = (routers?: Router[]) => {
    const [byte1, byte2, byte3] = this.baseIp.bytes;
    let b3 = byte3;
    if (routers && routers.length > 0) {
      routers.forEach((router) => {
        const interfaceIp = new IPv4Address(byte1, byte2, ++b3, 0, 24);
        this.routers.set(interfaceIp.ip, router);
        router.addInterface(this);
      });
    }
  };

  /**
   * Sends a message to a destination IP address. the destination must be connected to this link interface.
   * @param to
   * @param protocol
   * @param message
   */
  sendMessage = (
    from: Router,
    to: IPv4Address,
    protocol: IPProtocolNumber,
    message: IPacket
  ) => {
    const fromIpStr = this.routers.getKey(from);
    if (!fromIpStr) {
      throw new Error(
        "Unexpected sendMessage call on Link Interface. Does not connect the said IP address."
      );
    }
    const fromIp = IPv4Address.fromString(fromIpStr);
    switch (protocol) {
      case IPProtocolNumber.ospf:
        return ospfMessageHandler(this.id, fromIp, to, message, this.routers);
      default:
        break;
    }
  };
}
