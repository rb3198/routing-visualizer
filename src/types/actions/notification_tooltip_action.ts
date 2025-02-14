export type NotificationTooltipAction =
  | {
      type: "OPEN_NOTIFICATION_TOOLTIP";
      message: string;
      duration?: number;
    }
  | {
      type: "CLOSE_NOTIFICATION_TOOLTIP";
    };
