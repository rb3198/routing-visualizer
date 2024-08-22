import { Reducer } from "redux";
import { CellSizeAction } from "../types/actions";

export const cellSizeReducer: Reducer<number, CellSizeAction> = (
  state = 0,
  action
) => {
  const { type } = action;
  switch (type) {
    case "SET_CELL_SIZE":
      const { cellSize } = action;
      return cellSize;
    default:
      return state;
  }
};
