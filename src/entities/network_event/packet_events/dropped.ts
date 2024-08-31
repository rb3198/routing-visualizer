import { store } from "src/store";
import { Colors } from "../../../constants/theme";
import { OSPFPacket } from "../../ospf/packets/packet_base";
import { Router } from "../../router";
import { NetworkEventCallback } from "../base";
import { PacketEvent } from "./base";
import { openModal } from "src/action_creators";
import { IPPacket } from "src/entities/ip/packets";

export class PacketDroppedEvent extends PacketEvent {
  reason: string;
  router: Router;
  ipPacket: IPPacket;
  constructor(
    router: Router,
    packet: IPPacket,
    reason: string,
    callback?: NetworkEventCallback
  ) {
    if (!(packet.body instanceof OSPFPacket)) {
      throw new Error("OSPF Packet expected.");
    }
    const link = {
      label: "View Packet",
      onClick: () => {
        store.dispatch(openModal("packet", packet));
      },
    };
    super(packet.body, [link], callback);
    this.ipPacket = packet;
    this.router = router;
    this.reason = reason;
  }

  get message() {
    const { id } = this.router;
    return `<span style="color: ${Colors.droppedPacket}; font-weight: bold">Packet dropped</span> by router <b>${id}</b>.<br>
    <b>Reason:</b> ${this.reason}`;
  }
}
