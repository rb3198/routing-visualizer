import { emitEvent } from "../../action_creators";
import { IPAddresses } from "../../constants/ip_addresses";
import { store } from "../../store";
import { MessageHandler } from "../../types/common/message_handler";
import { IPProtocolNumber } from "../ip/enum/ip_protocol_number";
import { IPLinkInterface } from "../ip/link_interface";
import { IPPacket } from "../ip/packets";
import { IPHeader } from "../ip/packets/header";
import { PacketSentEvent } from "../network_event/packet_events/sent";
import { OSPFPacket } from "../ospf/packets/packet_base";
import { Router } from "../router";

const getPacketSentEvent = (
  src: Router,
  dest: Router,
  ipPacket: IPPacket,
  interfaceId: string
) => {
  return new PacketSentEvent(src, dest, ipPacket, interfaceId);
};

export const ospfMessageHandler: MessageHandler = async function (
  this: IPLinkInterface,
  interfaceId,
  source,
  destination,
  message,
  listeners,
  color,
  duration
) {
  if (!(message instanceof OSPFPacket)) {
    console.error(
      "Non-OSPF Message sent to be handled by OSPF Message handler."
    );
    return;
  }
  const context = window.elementLayer?.getContext("2d");
  const sourceRouter = listeners.get(source.toString());
  if (!sourceRouter) {
    return;
  }
  const { ip: dest } = destination;
  const ipHeader = new IPHeader(
    Date.now(),
    IPProtocolNumber.ospf,
    source,
    destination
  );
  const ipPacket = new IPPacket(ipHeader, message);
  if (destination.ip === IPAddresses.OSPFBroadcast.ip) {
    for (const dest of Array.from(listeners.values()).sort((a, b) =>
      a === sourceRouter ? -1 : 0
    )) {
      const event = getPacketSentEvent(
        sourceRouter,
        dest,
        ipPacket,
        interfaceId
      );
      const e = emitEvent({
        event,
        eventName: "packetSent",
        viz: {
          color,
          context,
          duration,
        },
      });
      await e(store.dispatch);
      dest.receiveIPPacket(interfaceId, ipPacket);
    }
    return;
  }
  if (!listeners.hasKey(dest)) {
    console.error(
      "Unexpected sendMessage call on Link Interface. Does not connect the said IP address. Destination is not a broadcast address."
    );
    return;
  }
  listeners.get(destination.ip)?.receiveIPPacket(interfaceId, ipPacket);
};
