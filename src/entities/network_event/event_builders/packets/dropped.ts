import { store } from "src/store";
import { Colors } from "../../../../constants/theme";
import { Router } from "../../../router";
import { IPPacket } from "src/entities/ip/packets";
import { NetworkEvent } from "../..";
import { openPacketModal } from "src/action_creators";

export function PacketDroppedEventBuilder(
  router: Router,
  packet: IPPacket,
  reason: string
): NetworkEvent {
  const { id } = router;
  return new NetworkEvent({
    timestamp: Date.now(),
    router: id.toString(),
    title: `<span style="color: ${Colors.droppedPacket}; font-weight: bold">Packet dropped</span> by router <b>${id}</b>.<br>
    <b>Reason:</b> ${reason}`,
    actions: [],
    links: [
      {
        label: "View Packet",
        onClick: () => store.dispatch(openPacketModal(packet)),
      },
    ],
  });
}
