import {
  CellSizeAction,
  EventLogAction,
  ModalAction,
  NotificationTooltipAction,
  SimulationConfigAction,
} from "../types/actions";
import { ActionCreator } from "redux";
import { RectDim } from "../types/geometry";
import { IPPacket } from "../entities/ip/packets";
import {
  NeighborTableRow,
  NeighborTableSnapshot,
} from "src/entities/ospf/table_rows";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { EVENT_LOG_STORAGE_COUNT_KEY } from "src/constants/storage";
import { LsDb } from "src/entities/router/ospf_interface/ls_db";
import { RoutingTable } from "src/entities/ospf/table_rows/routing_table_row";
import { NetworkEvent } from "src/entities/network_event";

export type VizArgs = {
  color: string;
  duration: number;
  context?: CanvasRenderingContext2D | null;
  packetRect?: RectDim;
};

export const emitEvent = (event: NetworkEvent): EventLogAction => {
  return {
    type: "ADD_LOG",
    data: event,
  };
};

export const setCellSize: ActionCreator<CellSizeAction> = (
  cellSize: number
) => {
  return {
    type: "SET_CELL_SIZE",
    cellSize,
  };
};

export const openPacketModal: ActionCreator<ModalAction> = (data: IPPacket) => {
  return {
    type: "OPEN_MODAL",
    active: "packet",
    data,
  };
};

export const openLsDbModal: ActionCreator<ModalAction> = (data: LsDb) => {
  return {
    type: "OPEN_MODAL",
    active: "ls_db",
    data,
  };
};

export const openNeighborTableSnapshot = (
  data: NeighborTableSnapshot
): ModalAction => {
  return {
    type: "OPEN_MODAL",
    active: "neighbor_table_snapshot",
    data,
  };
};

export const setLiveNeighborTable: ActionCreator<ModalAction> = (
  routerId: IPv4Address,
  neighborTable: Record<string, NeighborTableRow>
) => {
  return {
    type: "OPEN_MODAL",
    active: "neighbor_table_live",
    data: {
      routerId,
      neighborTable,
    },
  };
};

export const openRoutingTable: ActionCreator<ModalAction> = (
  routerId: IPv4Address,
  table: RoutingTable
) => {
  return {
    type: "OPEN_MODAL",
    active: "routing_table",
    data: { routerId, table },
  };
};
export const closeModal: ActionCreator<ModalAction> = () => {
  return {
    type: "CLOSE_MODAL",
  };
};

export const setEventLogKeepCount: ActionCreator<EventLogAction> = (
  keepCount: number
) => {
  localStorage.setItem(EVENT_LOG_STORAGE_COUNT_KEY, keepCount.toString());
  return {
    type: "SET_KEEP_COUNT",
    data: keepCount,
  };
};

export const setPropagationDelay = (delay: number): SimulationConfigAction => {
  return {
    type: "SET_PROPAGATION_DELAY",
    value: delay,
  };
};

export const setHelloInterval = (
  helloInterval: number
): SimulationConfigAction => {
  return {
    type: "SET_DEF_HELLO_INTERVAL",
    value: helloInterval,
  };
};

export const setGlobalGracefulShutdown = (
  graceful: boolean
): SimulationConfigAction => {
  return {
    type: "SET_GRACEFUL_SHUTDOWN",
    value: graceful,
  };
};
export const openNotificationTooltip = (
  message: string,
  duration?: number
): NotificationTooltipAction => {
  return {
    type: "OPEN_NOTIFICATION_TOOLTIP",
    message,
    duration,
  };
};

export const closeNotificationTooltip = (): NotificationTooltipAction => {
  return {
    type: "CLOSE_NOTIFICATION_TOOLTIP",
  };
};
