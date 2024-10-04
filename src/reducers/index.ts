import { combineReducers } from "redux";
import { eventLogReducer as eventLog } from "./event_log";
import { cellSizeReducer as cellSize } from "./cell_size";
import { modalReducer as modalState } from "./modals";
import { propagationDelay } from "./propagation_delay";

export const rootReducer = combineReducers({
  eventLog,
  cellSize,
  modalState,
  propagationDelay,
});

export type IRootReducer = ReturnType<typeof rootReducer>;
