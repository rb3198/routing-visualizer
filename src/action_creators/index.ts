import { CellSizeAction, EventLogAction } from "../types/actions";
import { ActionCreator, Dispatch } from "redux";
import { packetAnimations } from "../animations/packets";
import { Router } from "../entities/router";
import { RectDim } from "../types/geometry";

export type NetworkEvent = "packetTransfer" | "packetDrop";

export const emitEvent =
  (
    event: NetworkEvent,
    cellSize: number,
    src: Router,
    dest: Router,
    duration: number,
    color: string,
    context?: CanvasRenderingContext2D | null,
    packetRect?: RectDim
  ) =>
  async (dispatch: Dispatch): Promise<EventLogAction> => {
    if (context) {
      switch (event) {
        case "packetTransfer":
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
