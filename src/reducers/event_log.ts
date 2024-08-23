import { Reducer } from "redux";
import { EventLogAction } from "../types/actions";

type EventLogState = any[];

export const eventLogReducer: Reducer<EventLogState, EventLogAction> = (
  state = [],
  action
) => {
  const { type, data } = action;
  switch (type) {
    case "ADD_LOG":
      return [...state, data];
    default:
      return state;
  }
};
