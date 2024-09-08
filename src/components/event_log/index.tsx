import React, { useEffect, useMemo, useState } from "react";
import { IRootReducer } from "../../reducers";
import { connect, ConnectedProps } from "react-redux";
import styles from "./styles.module.css";
import { NetworkEventBase } from "../../entities/network_event/base";
import { bindActionCreators, Dispatch } from "redux";
import { setEventLogKeepCount } from "src/action_creators";
import { BiSearch } from "react-icons/bi";
import { NeighborTableEvent } from "src/entities/network_event/neighbor_table_event";

export type EventLogProps = {
  filter?: {
    type: "neighbor"; // Add new types if required here.
    routerId?: string;
  };
  showControlPanel?: boolean;
  classes?: string;
};

type ReduxProps = ConnectedProps<typeof connector>;
const EventLogComponent: React.FC<ReduxProps & EventLogProps> = (props) => {
  const {
    eventLog,
    keepCount,
    filter,
    showControlPanel,
    classes,
    setEventLogKeepCount,
  } = props;

  const { type, routerId } = filter || {};

  const ControlPanel = useMemo(() => {
    const changeHandler: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
      const { target } = e;
      const { value } = target;
      const keep = parseInt(value);
      if (isNaN(keep)) {
        return;
      }
      setEventLogKeepCount(keep);
    };
    return (
      <div id={styles.control_panel}>
        <div id={styles.search_box}>
          <label htmlFor={styles.search_input}>
            <BiSearch size={24} />
          </label>
          <input
            id={styles.search_input}
            placeholder="Search through the logs..."
          />
        </div>
        <div id={styles.log_size_selector_container}>
          <label htmlFor={styles.log_size_selector}>Keep the first:</label>
          <select id={styles.log_size_selector} onChange={changeHandler}>
            <option value={25} selected={keepCount === 25}>
              25 Logs
            </option>
            <option value={50} selected={keepCount === 50}>
              50 Logs
            </option>
            <option value={100} selected={keepCount === 100}>
              100 Logs
            </option>
          </select>
        </div>
      </div>
    );
  }, [keepCount, setEventLogKeepCount]);

  return (
    <div className={classes || ""}>
      <h2 id={styles.title}>Recent Events</h2>
      {(showControlPanel && ControlPanel) || <></>}
      <ul id={styles.log_list}>
        {eventLog
          .filter((event) => {
            let isValid = true;
            switch (type) {
              case "neighbor":
                isValid &&= event instanceof NeighborTableEvent;
                if (!isValid) break;
                if (routerId) {
                  isValid &&=
                    (event as NeighborTableEvent).routerId.toString() ===
                    routerId;
                }
                break;
              default:
                break;
            }
            return isValid;
          })
          .map((event) => (
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
  const { logs, keepCount } = eventLog;
  return {
    eventLog: logs,
    keepCount,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setEventLogKeepCount: bindActionCreators(setEventLogKeepCount, dispatch),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const EventLog = connector(EventLogComponent);
