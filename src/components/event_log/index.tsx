import React, { useEffect, useState } from "react";
import { IRootReducer } from "../../reducers";
import { connect, ConnectedProps } from "react-redux";
import styles from "./styles.module.css";
import { NetworkEventBase } from "../../entities/network_event/base";

type ReduxProps = ConnectedProps<typeof connector>;
const EventLogComponent: React.FC<ReduxProps> = (props) => {
  const { eventLog } = props;
  return (
    <div id={styles.container}>
      <h2 id={styles.title}>Event Log</h2>
      <ul id={styles.log_list}>
        {eventLog.map((event) => (
          <Event event={event} key={event.id} />
        ))}
      </ul>
    </div>
  );
};

const Event: React.FC<{ event: NetworkEventBase }> = (props) => {
  const { event } = props;
  const { message, links, id } = event;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
  }, []);
  return (
    <li className={`${styles.event} ${(visible && styles.visible) || ""}`}>
      <p dangerouslySetInnerHTML={{ __html: message }}></p>
      {links.length > 0 &&
        links.map((link, idx) => (
          <span
            key={`event_${id}_l${idx}`}
            onClick={link.onClick}
            className={styles.link}
          >
            {link.label}
          </span>
        ))}
    </li>
  );
};

const mapStateToProps = (state: IRootReducer) => {
  const { eventLog } = state;
  return {
    eventLog,
  };
};

const connector = connect(mapStateToProps);

export const EventLog = connector(EventLogComponent);
