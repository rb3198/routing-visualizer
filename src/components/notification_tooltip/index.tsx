import React, { memo, useContext, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { NotificationTooltipContext } from "../../contexts/notification_tooltip";

export const NotificationTooltip: React.FC = memo(() => {
  const tooltipContext = useContext(NotificationTooltipContext);
  const { message, visible, duration, close } = tooltipContext || {};
  const timerRef = useRef<NodeJS.Timeout>();
  if (visible && close) {
    timerRef.current = setTimeout(close, duration);
  }
  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
    };
  }, []);
  return (
    <div id={styles.container} className={(visible && styles.visible) || ""}>
      {message}
    </div>
  );
});
