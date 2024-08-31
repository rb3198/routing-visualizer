import { openModal } from "../../../action_creators";
import { PacketColorMap } from "../../../constants/theme";
import { store } from "../../../store";
import { IPPacket } from "../../ip/packets";
import { PacketType } from "../../ospf/enum";
import { OSPFPacket } from "../../ospf/packets/packet_base";
import { Router } from "../../router";
import { NetworkEventCallback } from "../base";
import { PacketEvent } from "./base";

export class PacketSentEvent extends PacketEvent {
  src: Router;
  dest: Router;
  interfaceId: string;
  ipPacket: IPPacket;
  packetType: string;
  constructor(
    src: Router,
    dest: Router,
    packet: IPPacket,
    interfaceId: string,
    callback?: NetworkEventCallback
  ) {
    if (!(packet.body instanceof OSPFPacket)) {
      throw new Error("OSPF Packet expected.");
    }
    const packetType =
      Object.keys(PacketType)[
        Object.values(PacketType).indexOf(packet.body.header.type)
      ];
    const links = [
      {
        label: `What is a ${packetType} Packet?`,
        onClick: () => {},
      },
      {
        label: "View Packet",
        onClick: () => {
          store.dispatch(openModal("packet", packet));
        },
      },
    ];
    super(packet.body, links, callback);
    this.packetType = packetType;
    this.ipPacket = packet;
    this.src = src;
    this.dest = dest;
    this.interfaceId = interfaceId;
  }

  get message() {
    const { header: ipHeader } = this.ipPacket;
    const { destination } = ipHeader;
    const { header } = this.packet;
    const { routerId, type } = header;
    return `<span style="color: ${PacketColorMap.get(
      type
    )}; font-weight: bold">${
      this.packetType
    } packet</span> <i>sent</i> by router <b>${routerId.toString()}</b> to destination <b>${destination.toString()}</b>.`;
  }
}
