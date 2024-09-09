import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NeighborTableEvent } from "src/entities/network_event/neighbor_table_event";
import { NeighborTableRow } from "src/entities/ospf/tables";
import styles from "./styles.module.css";
import { getKey } from "src/utils/common";
import { State } from "src/entities/ospf/enum";
import { columnNames } from "./descriptions";

const getValue = (
  neighborTable: Record<string, NeighborTableRow>,
  neighborId: string,
  key: keyof NeighborTableRow
) => {
  const row = neighborTable[neighborId];
  if (!row) {
    return "";
  }
  const { state, master } = row;
  switch (key) {
    case "state":
      return getKey(State, state);
    case "master":
      return state > State.ExStart
        ? master
          ? "Master"
          : "Slave"
        : "Not Negotiated";
    case "dbSummaryList":
    case "linkStateRequestList":
    case "linkStateRetransmissionList":
      const arr = row[key];
      return `[ ${arr.join("<br>")} ]`;
    case "deadTimer":
    case "rxmtTimer":
      return typeof row[key] === "undefined" ? "Not Set" : "Timer Set";
    default:
      return typeof row[key] === "undefined" ? "Not Set" : row[key]?.toString();
  }
};

type CommonProps = {
  activeCol: keyof NeighborTableRow | "none";
  setActiveCol: React.Dispatch<
    React.SetStateAction<keyof NeighborTableRow | "none">
  >;
};

type EventNeighborTableProps = CommonProps & {
  type: "snap";
  event: NeighborTableEvent;
};

type LiveNeighborTableProps = CommonProps & {
  type: "live";
  neighborTable: Record<string, NeighborTableRow>;
};

type NeighborTableProps = CommonProps &
  (EventNeighborTableProps | LiveNeighborTableProps);
interface TableCellProps {
  activeCol: keyof NeighborTableRow | "none";
  col: keyof NeighborTableRow | "none";
  idx: number;
  setActiveCol: React.Dispatch<
    React.SetStateAction<keyof NeighborTableRow | "none">
  >;
  type: "th" | "td";
}

const TC: React.FC<PropsWithChildren<TableCellProps>> = (props) => {
  const { idx, col, activeCol, type, children, setActiveCol } = props;
  const [prevValue, setPrevValue] = useState(children);
  const wasStale = useRef(false);
  const [stale, setStale] = useState(false);
  const onMouseEnter = useCallback(() => {
    setActiveCol(col);
  }, [col, setActiveCol]);
  const onMouseLeave = useCallback(() => {
    setActiveCol("none");
  }, [setActiveCol]);

  useLayoutEffect(() => {
    let timeout: NodeJS.Timeout;
    if (children !== prevValue) {
      setStale(true);
      timeout = setTimeout(() => {
        setStale(false);
        setPrevValue(children);
        wasStale.current = true;
      }, 500);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [children, prevValue]);

  const elProps = {
    className: `${idx === 0 ? styles.fixed : ""} ${
      activeCol === col ? styles.hovered : ""
    }`,
    onMouseEnter,
    onMouseLeave,
  };
  return type === "th" ? (
    <th {...elProps}>{children}</th>
  ) : (
    <td {...elProps}>
      <div className={stale ? styles.out : wasStale.current ? styles.in : ""}>
        {prevValue}
      </div>
    </td>
  );
};

const EventTableBody: React.FC<EventNeighborTableProps> = (props) => {
  const { event, activeCol, setActiveCol } = props;
  const { affectedNeighborId, eventType, prevTable, neighborTable } = event;
  const [activeTable, setActiveTable] = useState(prevTable);
  const columns = useMemo(
    () =>
      Object.keys(columnNames).filter(
        (key) => !!columnNames[key as keyof NeighborTableRow]
      ),
    []
  );
  useLayoutEffect(() => {
    if (eventType === "added" || eventType === "deleted") {
      setActiveTable(neighborTable);
      return;
    }
    const timeout = setTimeout(() => {
      setActiveTable(neighborTable);
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, [eventType, neighborTable]);
  const rows = Object.values(activeTable);
  return (
    <>
      {rows.map((neighbor) => {
        const isAffected = neighbor.routerId.ip === affectedNeighborId;
        const rowClass =
          isAffected && eventType === "added" ? styles.added : "";
        return (
          <tr
            key={`neighbor_table_tr_${neighbor.routerId}`}
            className={rowClass}
          >
            {columns.map((col, idx) => {
              const key = col as keyof NeighborTableRow;
              const value = getValue(activeTable, neighbor.routerId.ip, key);
              return (
                <TC
                  key={`neighbor_table_${neighbor.routerId}_${col}`}
                  col={key}
                  activeCol={activeCol}
                  idx={idx}
                  setActiveCol={setActiveCol}
                  type="td"
                >
                  {value}
                </TC>
              );
            })}
          </tr>
        );
      })}
    </>
  );
};
const LiveTableBody: React.FC<LiveNeighborTableProps> = (props) => {
  const { activeCol, setActiveCol, neighborTable } = props;
  const [activeTable, setActiveTable] = useState(neighborTable);
  const columns = useMemo(
    () =>
      Object.keys(columnNames).filter(
        (key) => !!columnNames[key as keyof NeighborTableRow]
      ),
    []
  );
  useEffect(() => {
    const timeout = setTimeout(() => {
      setActiveTable(neighborTable);
    }, 5000);
    return () => {
      clearTimeout(timeout);
    };
  }, [neighborTable]);

  const rows = Object.values(neighborTable);
  return (
    <>
      {rows.map((neighbor) => {
        let className = "";
        if (
          !activeTable[neighbor.routerId.toString()] &&
          neighborTable[neighbor.routerId.toString()]
        ) {
          className = styles.added;
        }
        if (
          activeTable[neighbor.routerId.toString()] &&
          !neighborTable[neighbor.routerId.toString()]
        ) {
          className = styles.deleted;
        }
        return (
          <tr
            key={`neighbor_table_tr_${neighbor.routerId}`}
            className={className}
          >
            {columns.map((col, idx) => {
              const key = col as keyof NeighborTableRow;
              const value = getValue(neighborTable, neighbor.routerId.ip, key);
              return (
                <TC
                  key={`neighbor_table_${neighbor.routerId}_${col}`}
                  col={key}
                  activeCol={activeCol}
                  idx={idx}
                  setActiveCol={setActiveCol}
                  type="td"
                >
                  {value}
                </TC>
              );
            })}
          </tr>
        );
      })}
    </>
  );
};

/**
 * Component to visualize a router's neighbor table.
 * @param props The Props
 * @returns
 */
export const NeighborTable: React.FC<NeighborTableProps> = (props) => {
  const { activeCol, setActiveCol, type } = props;
  const columns = useMemo(
    () =>
      Object.keys(columnNames).filter(
        (key) => !!columnNames[key as keyof NeighborTableRow]
      ),
    []
  );

  const renderBody = () => {
    switch (type) {
      case "snap":
        const { event } = props;
        return (
          <EventTableBody
            event={event}
            type="snap"
            activeCol={activeCol}
            setActiveCol={setActiveCol}
          />
        );
      case "live":
        const { neighborTable } = props;
        return (
          <LiveTableBody
            neighborTable={neighborTable}
            type="live"
            activeCol={activeCol}
            setActiveCol={setActiveCol}
          />
        );
      default:
        return <></>;
    }
  };

  return (
    <table id={styles.table}>
      <tbody>
        <tr>
          {columns.map((col, idx) => (
            <TC
              key={`neighbor_table_th_${col}`}
              col={col as keyof NeighborTableRow}
              activeCol={activeCol}
              idx={idx}
              setActiveCol={setActiveCol}
              type="th"
            >
              {columnNames[col as keyof NeighborTableRow]}
            </TC>
          ))}
        </tr>
        {renderBody()}
      </tbody>
    </table>
  );
};
