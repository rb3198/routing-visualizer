import { openPacketModal } from "src/action_creators";
import { PacketColorMap } from "src/constants/theme";
import { store } from "src/store";
import { IPPacket } from "src/entities/ip/packets";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { Router } from "src/entities/router";
import { NetworkEventCallback } from "../base";
import { PacketEvent } from "./base";
import { getPacketTypeString } from "src/entities/ospf/enum/packet_type";

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
    const { body } = packet;
    const { header } = body || {};
    const { type } = header || {};
    const packetType = getPacketTypeString(type);
    const links = [
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
    super(body, links, callback);
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
