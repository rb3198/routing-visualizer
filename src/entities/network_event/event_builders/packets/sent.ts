import { store } from "src/store";
import { NetworkEvent } from "../..";
import { IPProtocolNumber } from "../../../ip/enum/ip_protocol_number";
import { IPv4Address } from "../../../ip/ipv4_address";
import { IPPacket } from "../../../ip/packets";
import {
  getPacketTypeString,
  PacketType as OSPFPacketType,
} from "../../../ospf/enum/packet_type";
import { OSPFPacket } from "../../../ospf/packets/packet_base";
import { openPacketModal } from "src/action_creators";
import { OspfPacketColorMap } from "src/constants/theme";
import { IPAddresses } from "src/constants/ip_addresses";

export function PacketSentEventBuilder(
  routerId: IPv4Address,
  packet: IPPacket
) {
  function getTitle(packet: IPPacket) {
    const { header } = packet;
    const { protocol, destination: ipDestination } = header;
    switch (protocol) {
      case IPProtocolNumber.ospf:
        const body = packet.body as OSPFPacket;
        const { header: ospfHeader } = body;
        const { type, routerId } = ospfHeader;
        return getOspfPacketTitle(type, routerId, ipDestination);
      default:
        return "";
    }
  }

  function getLinks(packet: IPPacket) {
    const { header } = packet;
    const { protocol } = header;
    switch (protocol) {
      case IPProtocolNumber.ospf:
        return getOspfPacketLinks(packet);
      default:
        return [];
    }
  }

  //#region OSPF packet descriptions
  function getOspfPacketLinks(packet: IPPacket) {
    const ospfPacket = packet.body as OSPFPacket;
    const { header } = ospfPacket;
    const { type } = header;
    const packetType = getPacketTypeString(type);
    return [
      {
        label: `What is a ${packetType} Packet?`,
        onClick: () => {},
      },
      {
        label: "View Packet",
        onClick: () => {
          store.dispatch(openPacketModal(packet));
        },
      },
    ];
  }

  function getOspfPacketTitle(
    packetType: OSPFPacketType,
    routerId: IPv4Address,
    destination: IPv4Address
  ) {
    let color = OspfPacketColorMap.get(packetType);
    return `
    <b style="color: ${color}">${
      getPacketTypeString(packetType) + " Packet"
    }</b> <i>sent</i> by router <b>${routerId.toString()}</b> to destination <b>${destination} ${
      (destination.equals(IPAddresses.OSPFBroadcast) &&
        "(OSPF Broadcast Address)") ||
      ""
    }</b>.
    `;
  }
  //#endregion

  return new NetworkEvent({
    timestamp: Date.now(),
    router: routerId.toString(),
    title: getTitle(packet),
    actions: [],
    links: getLinks(packet),
  });
}
