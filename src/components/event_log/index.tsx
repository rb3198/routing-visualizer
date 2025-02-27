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

const MS_IN_DAY = 86400000;
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
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filterByRouter, setFilterByRouter] = useState<string>();
  const [timeBounds, setTimeBounds] = useState<[number, number]>([
    Date.now(),
    Date.now() + MS_IN_DAY,
  ]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const { type, routerId } = filter || {};
  const routers = useMemo(
    () => Array.from(new Set(eventLog.map((event) => event.router))).sort(),
    [eventLog]
  );

  const onSearchInputChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      const { target } = e;
      setSearchKeyword(target.value);
    }, []);

  const ControlPanel = useMemo(() => {
    const onFilterClick = () => setFiltersVisible((prev) => !prev);
    return (
      <div id={styles.control_panel}>
        <div id={styles.search_box} className={styles.control}>
          <label htmlFor={styles.search_input}>
            <BiSearch size={24} />
          </label>
          <input
            id={styles.search_input}
            value={searchKeyword}
            onChange={onSearchInputChange}
            placeholder="Search through the logs..."
          />
        </div>
        <div className={styles.control} title="Filter" onClick={onFilterClick}>
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
  }, [searchKeyword, onSearchInputChange, clearEventLog]);

  const toggleEventLog = useCallback(() => {
    setExpanded((prevExpanded) => !prevExpanded);
  }, []);

  const onMinTimeChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      const { value } = e.target;
      setTimeBounds((prev) => {
        const epoch = Date.parse(new Date(value).toString());
        if (!prev) return prev;
        if (epoch > prev[1]) return [epoch, epoch];
        return [epoch, prev[1]];
      });
    }, []);

  const onMaxTimeChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      const { value } = e.target;
      setTimeBounds((prev) => {
        const epoch = Date.parse(new Date(value).toString());
        if (epoch < prev[0]) return [epoch, epoch];
        return [prev[0], epoch];
      });
    }, []);

  const Filters = useMemo(() => {
    const [minTime, maxTime] = timeBounds;
    const minDate = new Date(minTime);
    const maxDate = new Date(maxTime);

    return (
      <div id={styles.filter_container} data-visible={filtersVisible}>
        <h5 id={styles.filters_title}>Filters:</h5>
        <table id={styles.filter_table}>
          <tbody>
            <tr>
              <th>By Router:</th>
              <td>
                <select
                  onChange={(e) => setFilterByRouter(e.currentTarget.value)}
                  className={styles.drop_down}
                >
                  <option value={""}>All</option>
                  {routers.map((router) => (
                    <option key={router} value={router}>
                      {router}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <th>By Time Range:</th>
              <td>
                <div style={{ display: "flex", flexFlow: "column" }}>
                  <div className={styles.date_input_container}>
                    <label className={styles.date_label}>From:</label>
                    <input
                      type="datetime-local"
                      value={minDate.toLocaleString("sv").split("Z")[0]}
                      onChange={onMinTimeChange}
                    />
                  </div>
                  <div className={styles.date_input_container}>
                    <label className={styles.date_label}>To:</label>
                    <input
                      type="datetime-local"
                      value={maxDate.toLocaleString("sv").split("Z")[0]}
                      onChange={onMaxTimeChange}
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }, [filtersVisible, routers, timeBounds, onMinTimeChange, onMaxTimeChange]);

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
        {(showControlPanel && Filters) || <></>}
        <VirtualList
          estimatedHeight={300}
          items={eventLog.filter((event) => {
            const { router, timestamp, actions, title, actionLine } = event;
            const [minTime, maxTime] = timeBounds;
            if (type === "neighbor") {
              return router === routerId;
            }
            const routerValid = !filterByRouter || router === filterByRouter;
            const timeValid = timestamp >= minTime && timestamp <= maxTime;
            let searchValid = true;
            if (searchKeyword) {
              searchValid = false;
              searchValid ||= title.includes(searchKeyword);
              searchValid ||= actionLine?.includes(searchKeyword) ?? false;
              searchValid ||= actions.some((action) =>
                action.includes(searchKeyword)
              );
            }
            return routerValid && timeValid && searchValid;
          })}
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
