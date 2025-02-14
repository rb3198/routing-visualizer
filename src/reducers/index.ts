import { combineReducers } from "redux";
import { eventLogReducer as eventLog } from "./event_log";
import { cellSizeReducer as cellSize } from "./cell_size";
import { modalReducer as modalState } from "./modals";
import { propagationDelay } from "./propagation_delay";
import { notificationTooltip } from "./notification_tooltip";

export const rootReducer = combineReducers({
  eventLog,
  cellSize,
  modalState,
  propagationDelay,
  notificationTooltip,
});

export type IRootReducer = ReturnType<typeof rootReducer>;
