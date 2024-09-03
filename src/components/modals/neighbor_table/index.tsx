import React, { useLayoutEffect, useMemo, useState } from "react";
import { NeighborTable } from "src/components/modals/neighbor_table/table";
import { NeighborTableEvent } from "src/entities/network_event/neighbor_table_event";
import { NeighborTableRow } from "src/entities/ospf/tables";
import styles from "./styles.module.css";
import { descriptions } from "./descriptions";

export const NeighborTableModalBody: React.FC<{
  event: NeighborTableEvent;
  modalRef: React.RefObject<HTMLDivElement>;
}> = (props) => {
  const { event, modalRef } = props;
  const { neighborTable, affectedNeighborId, changeType, message } = event;
  const [activeCol, setActiveCol] = useState<keyof NeighborTableRow | "none">(
    "none"
  );
  const [descHeight, setDescHeight] = useState(0);

  useLayoutEffect(() => {
    let maxHeight = -1;
    Object.values(descriptions).forEach((description) => {
      const container = document.createElement("div");
      container.classList.add(styles.description);

      container.innerHTML = description;
      modalRef.current?.appendChild(container);
      const height = container.clientHeight;
      if (height > maxHeight) {
        maxHeight = height;
      }
      container.parentNode?.removeChild(container);
    });
    setDescHeight(maxHeight);
  }, [modalRef]);

  const Description = useMemo(() => {
    const desc = descriptions[activeCol];
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
  }, [activeCol, descHeight]);
  return (
    <>
      <div
        id={styles.message}
        dangerouslySetInnerHTML={{ __html: message }}
      ></div>
      <NeighborTable
        neighborTable={neighborTable}
        activeCol={activeCol}
        affectedNeighbor={{
          id: affectedNeighborId,
          type: changeType,
        }}
        setActiveCol={setActiveCol}
      />
      {Description}
    </>
  );
};
