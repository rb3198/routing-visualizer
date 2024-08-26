import { Reducer } from "redux";
import { IPPacket } from "../entities/ip/packets";
import { ModalAction } from "../types/actions";

export type ModalReducerState = {
  active: "packet_desc" | "packet" | "none";
  data?: IPPacket | null;
};

const initialState: ModalReducerState = {
  data: null,
  active: "none",
};
export const modalReducer: Reducer<ModalReducerState, ModalAction> = (
  state = initialState,
  action
) => {
  const { type } = action;
  switch (type) {
    case "OPEN_MODAL":
      const { data, modal } = action;
      return {
        active: modal,
        data,
      };
    case "CLOSE_MODAL":
      return {
        active: "none",
        data: null,
      };
    default:
      return state;
  }
};
