import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { NeighborTableRow } from "src/entities/ospf/table_rows";
import styles from "./styles.module.css";
import { getKey } from "src/utils/common";
import { State } from "src/entities/ospf/enum";
import { columnNames } from "./descriptions";
import { DDPacketSummary } from "src/entities/ospf/summaries/dd_packet_summary";
import { TC } from "../table/tc";
import { Table } from "../table";
import { renderLSAHeader } from "../routing_table/lsa_header";

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
    case "ddSeqNumber":
      return state > State.ExStart ? row[key]?.toString() : "Not Negotiated";
    case "dbSummaryList":
      const { dbSummaryList } = row;
      return !dbSummaryList.length
        ? "[ ]"
        : `
        <div>
          ${dbSummaryList.map((summary) => renderLSAHeader(summary)).join("")}
        </div>
      `;
    case "linkStateRequestList":
      const { linkStateRequestList } = row;
      return !linkStateRequestList.length
        ? "[ ]"
        : `
        <div>
          ${linkStateRequestList
            .map((header) => renderLSAHeader(header))
            .join("")}
        </div>
      `;
    case "linkStateRetransmissionList":
      const { linkStateRetransmissionList } = row;
      return !linkStateRetransmissionList.length
        ? "[ ]"
        : `
        <div>
          ${linkStateRetransmissionList
            .map((lsa) => renderLSAHeader(lsa.header))
            .join("")}
        </div>
      `;
    case "deadTimer":
    case "ddRxmtTimer":
    case "lsRequestRxmtTimer":
    case "lsRetransmissionRxmtTimer":
      return typeof row[key] === "undefined" ? "Not Set" : "Timer Set";
    case "lastReceivedDdPacket":
      const lastDdPacket = row[key];
      if (lastDdPacket instanceof DDPacketSummary) {
        const { ddSeqNumber, init, m, master } = lastDdPacket;
        return `
        <table class=${styles.nested_table}>
        <tr>
          <th>Sequence Number:</th>
          <td>${ddSeqNumber}</td>
        </tr>
        <tr>
          <th>Init?:</th>
          <td>${init}</td>
        </tr>
        <tr>
          <th>More?:</th>
          <td>${m}</td>
        </tr>
        <tr>
          <th>Master?:</th>
          <td>${master}</td>
        </tr>
        </table>`;
      }
      return "None";
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

type SnapshotProps = CommonProps & {
  type: "snap";
  prevTable: Record<string, NeighborTableRow>;
  table: Record<string, NeighborTableRow>;
};

type LiveNeighborTableProps = CommonProps & {
  type: "live";
  neighborTable: Record<string, NeighborTableRow>;
};

type NeighborTableProps = CommonProps &
  (SnapshotProps | LiveNeighborTableProps);

const SnapshotTableBody: React.FC<SnapshotProps> = (props) => {
  const { prevTable, table, activeCol, setActiveCol } = props;
  const [activeTable, setActiveTable] = useState(prevTable);
  const columns = useMemo(
    () =>
      Object.keys(columnNames).filter(
        (key) => !!columnNames[key as keyof NeighborTableRow]
      ),
    []
  );
  useLayoutEffect(() => {
    const timeout = setTimeout(() => {
      setActiveTable(table);
    }, 1500);
    return () => {
      clearTimeout(timeout);
    };
  }, [table]);
  const rows = Object.values(activeTable);
  return (
    <>
      {rows.map((neighbor) => {
        const { routerId: neighborId } = neighbor;
        const isAdded =
          activeTable === table &&
          !prevTable[`${neighborId}`] &&
          !!table[`${neighborId}`];
        const rowClass = isAdded ? styles.added : "";
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
        const { table, prevTable } = props;
        return (
          <SnapshotTableBody
            table={table}
            prevTable={prevTable}
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
    <Table>
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
    </Table>
  );
};
