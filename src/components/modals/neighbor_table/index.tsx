import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { NeighborTable } from "src/components/neighbor_table";
import { NeighborTableEvent } from "src/entities/network_event/neighbor_table_event";
import { NeighborTableRow } from "src/entities/ospf/tables";
import styles from "./styles.module.css";
import { descriptions } from "../../neighbor_table/descriptions";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { EventLog } from "src/components/event_log";

export type NeighborTableModalBodyProps =
  | {
      type: "live";
      routerId: IPv4Address;
      neighborTable: Record<string, NeighborTableRow>;
    }
  | {
      type: "snap";
      event: NeighborTableEvent;
    };

export const NeighborTableModalBody: React.FC<NeighborTableModalBodyProps> = (
  props
) => {
  const { type } = props;
  const mainRef = useRef<HTMLDivElement>(null);
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
      mainRef.current?.appendChild(container);
      const height = container.clientHeight;
      if (height > maxHeight) {
        maxHeight = height;
      }
      container.parentNode?.removeChild(container);
    });
    setDescHeight(maxHeight);
  }, []);

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

  const MainBody = useMemo(() => {
    const { type } = props;
    switch (type) {
      case "snap":
        const { event } = props;
        const { neighborTable, affectedNeighborId, changeType, message } =
          event;
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
          </>
        );
      case "live":
        const { neighborTable: liveNeighborTable } = props;
        return (
          <NeighborTable
            neighborTable={liveNeighborTable}
            activeCol={activeCol}
            setActiveCol={setActiveCol}
          />
        );
      default:
        return null;
    }
  }, [props, activeCol]);
  return (
    <div id={styles.container}>
      <div id={styles.main} ref={mainRef}>
        {MainBody}
        {Description}
      </div>
      {type === "live" && (
        <div id={styles.event_log_container}>
          <EventLog
            classes={styles.event_log}
            filter={{ type: "neighbor", routerId: props.routerId.toString() }}
          />
        </div>
      )}
    </div>
  );
};
