import { combineReducers } from "redux";
import { eventLogReducer as eventLog } from "./event_log";
import { cellSizeReducer as cellSize } from "./cell_size";
import { modalReducer as modalState } from "./modals";

export const rootReducer = combineReducers({
  eventLog,
  cellSize,
  modalState,
});

export type IRootReducer = ReturnType<typeof rootReducer>;
