import { IPv4Address } from "src/entities/ip/ipv4_address";
import { NetworkEvent, NetworkEventLink } from "../..";
import { IPPacket } from "src/entities/ip/packets";
import { IPProtocolNumber } from "src/entities/ip/enum/ip_protocol_number";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { OspfPacketColorMap } from "src/constants/theme";
import { getPacketTypeString } from "src/entities/ospf/enum/packet_type";

function getOspfPacketTitle(receivedBy: IPv4Address, ospfPacket: OSPFPacket) {
  const { header } = ospfPacket;
  const { type: packetType } = header;
  const color = OspfPacketColorMap.get(packetType);
  return `
        <b style="color: ${color}">${
    getPacketTypeString(packetType) + " Packet"
  }</b> <i>received</i> by router <b>${receivedBy.toString()}</b><br>
        `;
}

function getTitle(receivedBy: IPv4Address, ipPacket: IPPacket) {
  const { header, body } = ipPacket;
  const { protocol } = header;
  switch (protocol) {
    case IPProtocolNumber.ospf:
      return getOspfPacketTitle(receivedBy, body as OSPFPacket);
    default:
      return "";
  }
}

/**
 * Builder function to help build the `PacketProcessed` event.
 *
 * Packet handlers can call this function at
 * varied stages of their packet handling process to add handling details to be shown to the user.
 * @param receivedBy
 * @param ipPacket
 * @returns
 */
export function PacketProcessedEventBuilder(
  receivedBy: IPv4Address,
  ipPacket: IPPacket
) {
  const questions: string[] = [];
  const actions: string[] = [];
  const links: NetworkEventLink[] = [];
  const closure = () => {
    const title = getTitle(receivedBy, ipPacket);
    return new NetworkEvent({
      timestamp: Date.now(),
      title,
      router: receivedBy.toString(),
      questions,
      actionLine:
        actions.length > 0
          ? "The router took the following steps while processing the packet:"
          : "",
      actions,
      links,
    });
  };
  closure.addQuestion = (question: string) => {
    questions.push(question);
  };
  closure.addAction = (action: string) => {
    actions.push(action);
  };
  closure.addLink = (link: NetworkEventLink) => {
    links.push(link);
  };
  return closure;
}
