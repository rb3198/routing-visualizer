import { combineReducers } from "redux";
import { eventLogReducer as eventLog } from "./event_log";
import { cellSizeReducer as cellSize } from "./cell_size";

export const rootReducer = combineReducers({
  eventLog,
  cellSize,
});

export type IRootReducer = ReturnType<typeof rootReducer>;
