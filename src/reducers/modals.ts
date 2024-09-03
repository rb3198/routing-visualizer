import { Reducer } from "redux";
import { IPPacket } from "../entities/ip/packets";
import { ModalAction } from "../types/actions";
import { NeighborTableEvent } from "src/entities/network_event/neighbor_table_event";

export type ActiveModalState =
  | {
      active: "packet";
      data: IPPacket;
    }
  | {
      active: "neighbor_table";
      data: NeighborTableEvent;
    };

export type ModalReducerState =
  | ActiveModalState
  | {
      active: "none";
      data?: null;
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
      const { data, active } = action;
      if (active === "neighbor_table")
        return {
          active,
          data,
        };
      if (active === "packet")
        return {
          active,
          data,
        };
      return {
        active: "none",
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
