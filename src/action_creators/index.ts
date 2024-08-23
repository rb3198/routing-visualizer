import { CellSizeAction, EventLogAction } from "../types/actions";
import { ActionCreator, Dispatch } from "redux";
import { packetAnimations } from "../animations/packets";
import { Router } from "../entities/router";
import { RectDim } from "../types/geometry";
import { OSPFPacket } from "../entities/ospf/packets/packet_base";
import { store } from "../store";

export type EmitEventArgs = {
  packet: OSPFPacket;
  viz: {
    color: string;
    duration: number;
    context?: CanvasRenderingContext2D | null;
    packetRect?: RectDim;
  };
} & (
  | { event: "packetTransfer"; src: Router; dest: Router }
  | { event: "packetDrop"; router: Router }
);

export const emitEvent =
  (args: EmitEventArgs) =>
  async (dispatch: Dispatch): Promise<EventLogAction> => {
    const { event, viz } = args;
    const { cellSize } = store.getState();
    const { context, duration, color, packetRect } = viz;
    if (context) {
      switch (event) {
        case "packetTransfer":
          const { src, dest } = args;
          await packetAnimations.packetTransfer(
            context,
            cellSize,
            src,
            dest,
            duration,
            packetRect,
            color
          );
          break;
        case "packetDrop":
          const { router } = args;
          await packetAnimations.packetDrop(
            context,
            cellSize,
            router,
            duration,
            color,
            packetRect
          );
          break;
        default:
          break;
      }
    }
    return dispatch<EventLogAction>({
      type: "ADD_LOG",
      data: {},
    });
  };

export const setCellSize: ActionCreator<CellSizeAction> = (
  cellSize: number
) => {
  return {
    type: "SET_CELL_SIZE",
    cellSize,
  };
};
