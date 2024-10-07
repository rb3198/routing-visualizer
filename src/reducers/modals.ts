import { Reducer } from "redux";
import { IPPacket } from "../entities/ip/packets";
import { ModalAction } from "../types/actions";
import { NeighborTableEvent } from "src/entities/network_event/neighbor_table_event";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { NeighborTableRow } from "src/entities/ospf/tables";
import { LsDb } from "src/entities/router/ospf_interface/ls_db";

export type LiveNeighborTableState = {
  routerId: IPv4Address;
  neighborTable: Record<string, NeighborTableRow>;
};

export type ActiveModalState =
  | {
      active: "packet";
      data: IPPacket;
    }
  | {
      active: "neighbor_table_snapshot";
      data: NeighborTableEvent;
    }
  | {
      active: "neighbor_table_live";
      data: LiveNeighborTableState;
    }
  | {
      active: "ls_db";
      data: LsDb;
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
      if (active === "neighbor_table_snapshot")
        return {
          active,
          data,
        };
      if (active === "packet")
        return {
          active,
          data,
        };
      if (active === "neighbor_table_live") {
        return {
          active,
          data: {
            routerId: data.routerId,
            neighborTable: {
              ...data.neighborTable,
            },
          },
        };
      }
      if (active === "ls_db") {
        return {
          active,
          data,
        };
      }
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
