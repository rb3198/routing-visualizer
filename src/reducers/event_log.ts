import { Reducer } from "redux";
import { EventLogAction } from "../types/actions";
import { NetworkEvent } from "src/entities/network_event";

type EventLogState = {
  logs: NetworkEvent[];
};

export const eventLogReducer: Reducer<EventLogState, EventLogAction> = (
  state = {
    logs: [],
  },
  action
) => {
  const { type, data } = action;
  const { logs } = state;
  switch (type) {
    case "ADD_LOG":
      const newLogs = [data, ...logs];
      return {
        ...state,
        logs: newLogs,
      };
    default:
      return state;
  }
};
