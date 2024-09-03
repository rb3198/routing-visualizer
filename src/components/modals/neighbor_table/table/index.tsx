import React, { PropsWithChildren, useCallback, useMemo, useRef } from "react";
import { NeighborTableEventType } from "src/entities/network_event/neighbor_table_event";
import { NeighborTableRow } from "src/entities/ospf/tables";
import styles from "./styles.module.css";
import { getKey } from "src/utils/common";
import { State } from "src/entities/ospf/enum";
import { columnNames } from "../descriptions";

interface NeighborTableProps {
  neighborTable: Record<string, NeighborTableRow>;
  activeCol: keyof NeighborTableRow | "none";
  setActiveCol: React.Dispatch<
    React.SetStateAction<keyof NeighborTableRow | "none">
  >;
  affectedNeighbor?: {
    id: string;
    type: NeighborTableEventType;
  };
}

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
  const onMouseEnter = useCallback(() => {
    setActiveCol(col);
  }, [col, setActiveCol]);
  const onMouseLeave = useCallback(() => {
    setActiveCol("none");
  }, [setActiveCol]);

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
    <td {...elProps}>{children}</td>
  );
};

/**
 * Component to visualize a router's neighbor table.
 * @param props The Props
 * @returns
 */
export const NeighborTable: React.FC<NeighborTableProps> = (props) => {
  const affectedNeighborRef = useRef<HTMLTableRowElement>(null);
  const { neighborTable, affectedNeighbor, activeCol, setActiveCol } = props;
  const { id: affectedNeighborId, type: changeType } = affectedNeighbor || {};
  const rows = Object.values(neighborTable);
  const columns = useMemo(
    () =>
      Object.keys(columnNames).filter(
        (key) => !!columnNames[key as keyof NeighborTableRow]
      ),
    []
  );
  const getValue = useCallback(
    (neighborId: string, key: keyof NeighborTableRow) => {
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
          return typeof row[key] === "undefined"
            ? "Not Set"
            : row[key]?.toString();
      }
    },
    [neighborTable]
  );

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
        {rows.map((neighbor) => {
          const isAffected = neighbor.routerId.ip === affectedNeighborId;
          const className = isAffected
            ? changeType === "added"
              ? styles.added
              : styles.deleted
            : "";
          return (
            <tr
              key={`neighbor_table_tr_${neighbor.routerId}`}
              ref={isAffected ? affectedNeighborRef : null}
              className={className}
            >
              {columns.map((col, idx) => {
                const value = getValue(
                  neighbor.routerId.ip,
                  col as keyof NeighborTableRow
                );
                return (
                  <TC
                    key={`neighbor_table_${neighbor.routerId}_${col}`}
                    col={col as keyof NeighborTableRow}
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
      </tbody>
    </table>
  );
};
