import { Colors } from "../../../constants/theme";
import { OSPFPacket } from "../../ospf/packets/packet_base";
import { Router } from "../../router";
import { NetworkEventCallback } from "../base";
import { PacketEvent } from "./base";

export class PacketDroppedEvent extends PacketEvent {
  reason: string;
  router: Router;
  constructor(
    router: Router,
    packet: OSPFPacket,
    reason: string,
    callback?: NetworkEventCallback
  ) {
    const link = {
      label: "View Packet",
      onClick: () => {}, // TODO: When Modal is created, dispatch a store event opening the modal showing the packet.
    };
    super(packet, [link], callback);
    this.router = router;
    this.reason = reason;
  }

  get message() {
    const { id } = this.router;
    return `<span style="color: ${Colors.droppedPacket}; font-weight: bold">Packet dropped</span> by router <b>${id}</b>.<br>
    <b>Reason:</b> ${this.reason}.`;
  }
}
