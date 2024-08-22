import { Reducer } from "redux";
import { EventLogAction } from "../types/actions";

type EventLogState = {
  cellSize: number;
  logs: any[];
};

const initialState: EventLogState = {
  cellSize: 0,
  logs: [],
};

export const eventLogReducer: Reducer<EventLogState, EventLogAction> = (
  state = initialState,
  action
) => {
  const { type, data } = action;
  const { logs } = state;
  switch (type) {
    case "ADD_LOG":
      return {
        ...state,
        logs: [...logs, data],
      };
    default:
      return state;
  }
};
