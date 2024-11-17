import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { RoutingTableRow } from "src/entities/ospf/table_rows";
import styles from "./styles.module.css";
import { getDescriptions } from "../../routing_table/descriptions";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { RoutingTable } from "src/entities/ospf/table_rows/routing_table_row";
import { RoutingTableVisual } from "src/components/routing_table";

export type RoutingTableModalBodyProps = {
  modalRef: React.RefObject<HTMLDivElement>;
  routerId: IPv4Address;
  table: RoutingTable;
};

export const RoutingTableModalBody: React.FC<RoutingTableModalBodyProps> = (
  props
) => {
  const { modalRef, table } = props;
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeRowIdx, setActiveRowIdx] = useState(-1);
  const [activeCol, setActiveCol] = useState<keyof RoutingTableRow | "none">(
    "none"
  );
  const [descHeight, setDescHeight] = useState(0);

  useLayoutEffect(() => {
    let maxHeight = -1;
    modalRef.current?.classList.add(styles.fixed_modal);
    Object.values(getDescriptions()).forEach((description) => {
      const container = document.createElement("div");
      container.classList.add(styles.description);

      container.innerHTML = description;
      mainRef.current?.appendChild(container);
      const height = container.clientHeight;
      if (height > maxHeight) {
        maxHeight = height;
      }
      container.parentNode?.removeChild(container);
    });
    setDescHeight(maxHeight);
  }, [modalRef]);

  const Description = useMemo(() => {
    const desc = getDescriptions(
      activeRowIdx > -1 ? table[activeRowIdx] : undefined
    )[activeCol];
    return (
      <div
        id={styles.description}
        className={
          activeCol === "none" ? styles.centered_text : styles.justified_text
        }
        style={{ height: descHeight }}
        dangerouslySetInnerHTML={{ __html: desc }}
      ></div>
    );
  }, [activeCol, table, activeRowIdx, descHeight]);

  const MainBody = useMemo(() => {
    return (
      <RoutingTableVisual
        table={table}
        activeCol={activeCol}
        setActiveCol={setActiveCol}
        setActiveRow={setActiveRowIdx}
      />
    );
  }, [table, activeCol]);
  return (
    <div id={styles.container}>
      <div id={styles.main} ref={mainRef}>
        {MainBody}
        {Description}
      </div>
    </div>
  );
};
