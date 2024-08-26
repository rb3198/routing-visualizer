import { Reducer } from "redux";
import { EventLogAction } from "../types/actions";
import { NetworkEventBase } from "../entities/network_event/base";

type EventLogState = NetworkEventBase[];

export const eventLogReducer: Reducer<EventLogState, EventLogAction> = (
  state = [],
  action
) => {
  const { type, data } = action;
  switch (type) {
    case "ADD_LOG":
      return [data, ...state];
    default:
      return state;
  }
};
