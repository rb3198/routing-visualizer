import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IRootReducer } from "../../reducers";
import { connect, ConnectedProps } from "react-redux";
import styles from "./styles.module.css";
import { bindActionCreators, Dispatch } from "redux";
import { setEventLogKeepCount } from "src/action_creators";
import { BiSearch } from "react-icons/bi";
import { MdKeyboardArrowUp } from "react-icons/md";
import { NetworkEvent } from "src/entities/network_event";

export type EventLogProps = {
  filter?: {
    type: "neighbor"; // Add new types if required here.
    routerId?: string;
  };
  showControlPanel?: boolean;
  classes?: string;
  hideLinks?: boolean;
  expanded?: boolean;
  showExpandToggle?: boolean;
  noBorders?: boolean;
};

type ReduxProps = ConnectedProps<typeof connector>;
const EventLogComponent: React.FC<ReduxProps & EventLogProps> = (props) => {
  const {
    eventLog,
    keepCount,
    filter,
    showControlPanel,
    classes,
    hideLinks,
    showExpandToggle,
    noBorders,
    expanded: defaultExpanded,
    setEventLogKeepCount,
  } = props;

  const [expanded, setExpanded] = useState(defaultExpanded || false);

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
          <label htmlFor={styles.log_size_selector}>Keep the last:</label>
          <select
            id={styles.log_size_selector}
            onChange={changeHandler}
            defaultValue={keepCount}
          >
            <option value={200}>200 Logs</option>
            <option value={600}>600 Logs</option>
            <option value={1000}>1000 Logs</option>
          </select>
        </div>
      </div>
    );
  }, [keepCount, setEventLogKeepCount]);

  const toggleEventLog = useCallback(() => {
    setExpanded((prevExpanded) => !prevExpanded);
  }, []);

  return (
    <div
      className={`${classes || ""} ${styles.container} ${
        expanded ? styles.expanded : ""
      }`}
    >
      {showExpandToggle && (
        <div id={styles.toggle} onClick={toggleEventLog}>
          Event Log
          <MdKeyboardArrowUp
            className={`${styles.toggle_icon} ${
              (expanded && styles.expanded) || ""
            }`}
          />
        </div>
      )}
      <div id={styles.main} data-no-borders={noBorders}>
        <h2 id={styles.title}>Recent Events</h2>
        {(showControlPanel && ControlPanel) || <></>}
        <ul id={styles.log_list}>
          {eventLog
            .filter((event) => event.router === routerId)
            .map((event) => (
              <Event event={event} key={event.id} hideLinks={hideLinks} />
            ))}
        </ul>
      </div>
    </div>
  );
};

const Event: React.FC<{ event: NetworkEvent; hideLinks?: boolean }> = (
  props
) => {
  const { event, hideLinks } = props;
  const { actions, title, links, id } = event;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
  }, []);
  return (
    <li className={`${styles.event} ${(visible && styles.visible) || ""}`}>
      <p dangerouslySetInnerHTML={{ __html: title }}></p>
      {links.length > 0 &&
        !hideLinks &&
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
