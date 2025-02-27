import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IRootReducer } from "../../reducers";
import { connect, ConnectedProps } from "react-redux";
import styles from "./styles.module.css";
import { bindActionCreators, Dispatch } from "redux";
import { BiSearch } from "react-icons/bi";
import { MdKeyboardArrowUp } from "react-icons/md";
import { NetworkEvent } from "src/entities/network_event";
import { CiFilter } from "react-icons/ci";
import { VscClearAll } from "react-icons/vsc";
import { clearEventLog } from "src/action_creators";
import { VirtualList } from "../virtual_list";

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
    filter,
    showControlPanel,
    classes,
    hideLinks,
    showExpandToggle,
    noBorders,
    expanded: defaultExpanded,
    clearEventLog,
  } = props;

  const [expanded, setExpanded] = useState(defaultExpanded || false);

  const { type, routerId } = filter || {};

  const ControlPanel = useMemo(() => {
    return (
      <div id={styles.control_panel}>
        <div id={styles.search_box} className={styles.control}>
          <label htmlFor={styles.search_input}>
            <BiSearch size={24} />
          </label>
          <input
            id={styles.search_input}
            placeholder="Search through the logs..."
          />
        </div>
        <div className={styles.control} title="Filter">
          <CiFilter />
        </div>
        <div
          className={styles.control}
          title="Clear All"
          onClick={clearEventLog}
        >
          <VscClearAll />
        </div>
      </div>
    );
  }, [clearEventLog]);

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
        <VirtualList
          estimatedHeight={300}
          items={eventLog.filter((event) =>
            type === "neighbor" ? event.router === routerId : true
          )}
          keyExtractor={(item) => item.id}
          renderItem={(event) => <Event event={event} hideLinks={hideLinks} />}
          windowSize={30}
          refreshDelta={30}
          classes={styles.log_list}
        />
      </div>
    </div>
  );
};

const Event: React.FC<{ event: NetworkEvent; hideLinks?: boolean }> = (
  props
) => {
  const { event, hideLinks } = props;
  const { id, title, questions, actionLine, actions, links } = event;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
  }, []);

  const renderQas = useCallback((type: "q" | "a", qas: string[]) => {
    if (!qas?.length) {
      return <></>;
    }
    if (qas?.length === 1 && type === "q") {
      return <p dangerouslySetInnerHTML={{ __html: qas[0] }}></p>;
    }
    return (
      <ul>
        {qas.map((qa, idx) => (
          <li key={idx} dangerouslySetInnerHTML={{ __html: qa }}></li>
        ))}
      </ul>
    );
  }, []);
  return (
    <li className={`${styles.event} ${(visible && styles.visible) || ""}`}>
      <p dangerouslySetInnerHTML={{ __html: title }}></p>
      {renderQas("q", questions)}
      {(actionLine && <b>{actionLine}</b>) || <></>}
      {renderQas("a", actions)}
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
  const { logs } = eventLog;
  return {
    eventLog: logs,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    clearEventLog: bindActionCreators(clearEventLog, dispatch),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const EventLog = connector(EventLogComponent);
