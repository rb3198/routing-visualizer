import { Reducer } from "redux";
import { PropagationDelayAction } from "src/types/actions";

export const PROPAGATION_DELAY_KEY = "PROPAGATION_DELAY_KEY";

export const DEFAULT_PROPAGATION_DELAY = 2000; // 2000ms = 2s

export const propagationDelay: Reducer<number, PropagationDelayAction> = (
  state = parseInt(
    localStorage.getItem(PROPAGATION_DELAY_KEY) ??
      DEFAULT_PROPAGATION_DELAY.toString()
  ),
  action
) => {
  const { type, value } = action;
  switch (type) {
    case "SET_PROPAGATION_DELAY":
      localStorage.setItem(PROPAGATION_DELAY_KEY, value.toString());
      return value;
    default:
      return state;
  }
};
