import { Reducer } from "redux";
import { EventLogAction } from "../types/actions";
import { EVENT_LOG_STORAGE_COUNT_KEY } from "src/constants/storage";
import { NetworkEvent } from "src/entities/network_event";

type EventLogState = {
  logs: NetworkEvent[];
  keepCount: number;
};

export const eventLogReducer: Reducer<EventLogState, EventLogAction> = (
  state = {
    logs: [],
    keepCount:
      parseInt(localStorage.getItem(EVENT_LOG_STORAGE_COUNT_KEY) || "0") || 600,
  },
  action
) => {
  const { type, data } = action;
  const { logs, keepCount } = state;
  switch (type) {
    case "ADD_LOG":
      const newLogs = [data, ...logs].slice(0, keepCount);
      return {
        ...state,
        logs: newLogs,
      };
    case "SET_KEEP_COUNT":
      return {
        ...state,
        keepCount: data,
      };
    default:
      return state;
  }
};
