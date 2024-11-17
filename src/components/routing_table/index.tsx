import React, { useEffect, useMemo, useState } from "react";
import {
  RoutingTable,
  RoutingTableRow,
} from "src/entities/ospf/table_rows/routing_table_row";
import { columnNames } from "./descriptions";
import { TC } from "../table/tc";
import { Table } from "../table";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import styles from "./styles.module.css";
import { renderLSAHeader } from "./lsa_header";

type RoutingTableProps = {
  table: RoutingTable;
  activeCol: keyof RoutingTableRow | "none";
  setActiveCol: React.Dispatch<
    React.SetStateAction<keyof RoutingTableRow | "none">
  >;
  setActiveRow: React.Dispatch<React.SetStateAction<number>>;
};

const getValue = (
  table: RoutingTable,
  idx: number,
  key: keyof RoutingTableRow
) => {
  const row = table[idx];
  if (!row) {
    return "";
  }
  switch (key) {
    case "addressMask":
    case "destinationId":
    case "advertisingRouter":
      const value = row[key];
      return (value && `${new IPv4Address(...value.bytes)}`) || "Not Set";
    case "nextHops":
      const { nextHops } = row;
      return !nextHops.length
        ? "-"
        : `
        <div>
          ${nextHops.map((nextHop) => nextHop.interfaceId).join(",")}
        </div>
      `;
    case "linkStateOrigin":
      const { linkStateOrigin } = row;
      return linkStateOrigin ? renderLSAHeader(linkStateOrigin?.header) : "";
    default:
      return typeof row[key] === "undefined" ? "Not Set" : `${row[key]}`;
  }
};

/**
 * Component to visualize a router's Routing table.
 * @param props The Props
 * @returns
 */
export const RoutingTableVisual: React.FC<RoutingTableProps> = (props) => {
  const { table, activeCol, setActiveCol, setActiveRow } = props;
  const [activeTable, setActiveTable] = useState(table);
  const columns = useMemo(
    () =>
      Object.keys(columnNames).filter(
        (key) => !!columnNames[key as keyof RoutingTableRow]
      ),
    []
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setActiveTable(table);
    }, 5000);
    return () => {
      clearTimeout(timeout);
    };
  }, [table]);
  const rows = Object.values(table);
  return (
    <Table>
      <tr>
        {columns.map((col, idx) => (
          <TC
            key={`router_table_th_${col}`}
            col={col as keyof RoutingTableRow}
            activeCol={activeCol}
            idx={idx}
            setActiveCol={setActiveCol}
            type="th"
          >
            {columnNames[col as keyof RoutingTableRow]}
          </TC>
        ))}
      </tr>
      {rows.map((route, rowIdx) => {
        let className = "";
        const onMouseOver = () => setActiveRow(rowIdx);
        const onMouseOut = () => setActiveRow(-1);
        const { destinationId } = route;
        const destIp = new IPv4Address(...destinationId.bytes);
        if (!activeTable[rowIdx] && table[rowIdx]) {
          className = styles.added;
        }
        if (activeTable[rowIdx] && !table[rowIdx]) {
          className = styles.deleted;
        }
        return (
          <tr
            key={`routing_table_tr_${destIp}`}
            className={className}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
          >
            {columns.map((col, idx) => {
              const key = col as keyof RoutingTableRow;
              const value = getValue(table, rowIdx, key);
              return (
                <TC
                  key={`router_table_td_${col}`}
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
    </Table>
  );
};
