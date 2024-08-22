import { CellSizeAction } from "../types/actions";
import { ActionCreator } from "redux";

export const setCellSize: ActionCreator<CellSizeAction> = (
  cellSize: number
) => {
  return {
    type: "SET_CELL_SIZE",
    cellSize,
  };
};
