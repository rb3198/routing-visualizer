import { combineReducers } from "redux";
import { eventLogReducer as eventLog } from "./event_log";
import { cellSizeReducer as cellSize } from "./cell_size";
import { modalReducer as modalState } from "./modals";
import { notificationTooltip } from "./notification_tooltip";
import { simulationConfig } from "./simulation_config";

export const rootReducer = combineReducers({
  eventLog,
  cellSize,
  modalState,
  simulationConfig,
  notificationTooltip,
});

export type IRootReducer = ReturnType<typeof rootReducer>;
