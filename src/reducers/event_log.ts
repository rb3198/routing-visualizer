import { Reducer } from "redux";
import { EventLogAction } from "../types/actions";
import { NetworkEventBase } from "../entities/network_event/base";

type EventLogState = {
  logs: NetworkEventBase[];
  keepCount: number;
};

export const eventLogReducer: Reducer<EventLogState, EventLogAction> = (
  state = {
    logs: [],
    keepCount: 200,
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
