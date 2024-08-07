import { IPAddresses } from "../../constants/ip_addresses";
import { MessageHandler } from "../../types/common/message_handler";
import { IPProtocolNumber } from "../ip/enum/ip_protocol_number";
import { IPPacket } from "../ip/packets";
import { IPHeader } from "../ip/packets/header";
import { OSPFPacket } from "../ospf/packets/packet_base";

export const ospfMessageHandler: MessageHandler = (
  interfaceId,
  source,
  destination,
  message,
  listeners
) => {
  if (!(message instanceof OSPFPacket)) {
    throw new Error(
      "Non-OSPF Message sent to be handled by OSPF Message handler."
    );
  }
  const { ip: dest } = destination;
  if (destination.ip === IPAddresses.OSPFBroadcast.ip) {
    listeners.forEach((router) => {
      router.receiveIPPacket(interfaceId, ipPacket);
    });
    return;
  }
  if (!listeners.hasKey(dest)) {
    console.error(
      "Unexpected sendMessage call on Link Interface. Does not connect the said IP address. Destination is not a broadcast address."
    );
    return;
  }
  const ipHeader = new IPHeader(1, IPProtocolNumber.ospf, source, destination);
  const ipPacket = new IPPacket(ipHeader, message);
  listeners.get(destination.ip)?.receiveIPPacket(interfaceId, ipPacket);
};
