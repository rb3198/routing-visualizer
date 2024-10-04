import { CellSizeAction, EventLogAction, ModalAction } from "../types/actions";
import { ActionCreator, Dispatch } from "redux";
import { packetAnimations } from "../animations/packets";
import { RectDim } from "../types/geometry";
import { store } from "../store";
import { PacketSentEvent } from "../entities/network_event/packet_events/sent";
import { PacketDroppedEvent } from "../entities/network_event/packet_events/dropped";
import { InterfaceNetworkEvent } from "../entities/network_event/interface_event";
import { IPPacket } from "../entities/ip/packets";
import { NeighborTableEvent } from "src/entities/network_event/neighbor_table_event";
import { NeighborTableRow } from "src/entities/ospf/tables";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { EVENT_LOG_STORAGE_COUNT_KEY } from "src/constants/storage";

export type VizArgs = {
  color: string;
  duration: number;
  context?: CanvasRenderingContext2D | null;
  packetRect?: RectDim;
};

export type EmitEventArgs =
  | {
      event: PacketSentEvent;
      eventName: "packetSent";
      viz: VizArgs;
    }
  | {
      event: PacketDroppedEvent;
      eventName: "packetDropped";
      viz: VizArgs;
    }
  | {
      event: InterfaceNetworkEvent;
      eventName: "interfaceEvent";
    }
  | {
      event: NeighborTableEvent;
      eventName: "neighborTableEvent";
    };

const packetSent = async (event: PacketSentEvent, viz: VizArgs) => {
  const { src, dest } = event;
  const { context, duration, packetRect, color } = viz;
  const { cellSize } = store.getState();
  context &&
    (await packetAnimations.packetTransfer(
      context,
      cellSize,
      src,
      dest,
      duration,
      packetRect,
      color
    ));
};

const packetDrop = async (event: PacketDroppedEvent, viz: VizArgs) => {
  const { router } = event;
  const { context, duration, color, packetRect } = viz;
  const { cellSize } = store.getState();
  context &&
    (await packetAnimations.packetDrop(
      context,
      cellSize,
      router,
      duration,
      color,
      packetRect
    ));
};

export const emitEvent =
  (args: EmitEventArgs) =>
  async (dispatch: Dispatch): Promise<void> => {
    const { event, eventName } = args;
    dispatch<EventLogAction>({
      type: "ADD_LOG",
      data: event,
    });
    switch (eventName) {
      case "packetSent":
        await packetSent(event, args.viz);
        break;
      case "packetDropped":
        await packetDrop(event, args.viz);
        break;
      default:
        break;
    }
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

export const openNeighborTableSnapshot: ActionCreator<ModalAction> = (
  data: NeighborTableEvent
) => {
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

export const setPropagationDelay = (delay: number) => {
  return {
    type: "SET_PROPAGATION_DELAY",
    value: delay,
  };
};
