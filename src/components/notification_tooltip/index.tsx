import React, { memo, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { IRootReducer } from "src/reducers";
import { connect, ConnectedProps } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { closeNotificationTooltip } from "src/action_creators";

type NotificationTooltipProps = ConnectedProps<typeof connector>;
const NotificationTooltipComponent: React.FC<NotificationTooltipProps> = memo(
  (props) => {
    const { message, visible, duration, close } = props;
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
  }
);

const mapStateToProps = (state: IRootReducer) => {
  const { notificationTooltip } = state;
  return notificationTooltip;
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    close: bindActionCreators(closeNotificationTooltip, dispatch),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const NotificationTooltip = connector(NotificationTooltipComponent);
