import { IPPacket } from "../../entities/ip/packets";

export type ModalAction =
  | {
      type: "OPEN_MODAL";
      data: IPPacket;
      modal: "packet_desc" | "packet";
    }
  | {
      type: "CLOSE_MODAL";
    };
