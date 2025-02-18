import { Reducer } from "redux";
import { IPPacket } from "../entities/ip/packets";
import { ModalAction } from "../types/actions";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import {
  NeighborTableRow,
  NeighborTableSnapshot,
} from "src/entities/ospf/table_rows";
import { LsDb } from "src/entities/router/ospf_interface/ls_db";
import { RoutingTable } from "src/entities/ospf/table_rows/routing_table_row";

export type LiveNeighborTableState = {
  routerId: IPv4Address;
  neighborTable: Record<string, NeighborTableRow>;
};

export type LiveRoutingTableState = {
  routerId: IPv4Address;
  table: RoutingTable;
};
export type ActiveModalState =
  | {
      active: "packet";
      data: IPPacket;
    }
  | {
      active: "neighbor_table_snapshot";
      data: NeighborTableSnapshot;
    }
  | {
      active: "neighbor_table_live";
      data: LiveNeighborTableState;
    }
  | {
      active: "ls_db";
      data: LsDb;
    }
  | {
      active: "routing_table";
      data: LiveRoutingTableState;
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
      if (active === "routing_table") {
        return { active, data };
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
