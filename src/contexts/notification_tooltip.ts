import { createContext } from "react";

export interface NotificationTooltipState {
  message: string;
  /**
   * Duration that the tooltip is visible, in ms.
   */
  duration: number;
  visible?: boolean;
  close: () => any;
  open: (message: string) => any;
}

export const NotificationTooltipContext =
  createContext<NotificationTooltipState | null>(null);
