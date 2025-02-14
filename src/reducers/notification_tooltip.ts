import { Reducer } from "redux";
import { NotificationTooltipAction } from "src/types/actions";

type NotificationTooltipState = {
  visible: boolean;
  message: string;
  duration: number;
};

const defaultState: NotificationTooltipState = {
  visible: false,
  message: "",
  duration: 2000,
};

export const notificationTooltip: Reducer<
  NotificationTooltipState,
  NotificationTooltipAction
> = (state = defaultState, action) => {
  const { type } = action;
  switch (type) {
    case "OPEN_NOTIFICATION_TOOLTIP":
      const { message, duration } = action;
      return {
        message,
        duration: duration ?? state.duration,
        visible: true,
      };
    case "CLOSE_NOTIFICATION_TOOLTIP":
      return { ...defaultState };
    default:
      return state;
  }
};
