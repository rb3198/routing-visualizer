import React, { useLayoutEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { MdKeyboardArrowUp } from "react-icons/md";
import { PacketType } from "src/entities/ospf/enum";
import { OspfPacketColorMap } from "src/constants/theme";
import { getPacketTypeString } from "src/entities/ospf/enum/packet_type";

export const PacketLegend: React.FC = () => {
  const [open, setOpen] = useState(false);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const mainOgHeight = useRef(0);

  const toggleLegend = () => {
    setOpen((prevOpen) => {
      const newValue = !prevOpen;
      if (newValue && listContainerRef.current) {
        listContainerRef.current.style.height = `${mainOgHeight.current}px`;
        listContainerRef.current.style.maxHeight = `${mainOgHeight.current}px`;
      } else if (listContainerRef.current) {
        listContainerRef.current.style.maxHeight = `0`;
      }
      return newValue;
    });
  };

  useLayoutEffect(() => {
    if (
      !listContainerRef.current ||
      !listRef.current ||
      !containerRef.current
    ) {
      return;
    }
    const { width, height } = listRef.current.getBoundingClientRect();
    mainOgHeight.current = height;
    containerRef.current.style.width = `${width}px`;
    toggleLegend();
    return toggleLegend;
  }, []);
  return (
    <div
      id={styles.container}
      ref={containerRef}
      className={(open && styles.opened) || ""}
      onClick={toggleLegend}
    >
      <div
        id={styles.list_container}
        className={(open && styles.opened) || ""}
        ref={listContainerRef}
      ></div>
      <div id={styles.main}>
        <p>Packet Legend</p>
        <MdKeyboardArrowUp
          className={`${styles.expand} ${(open && styles.opened) || ""}`}
        />
        <ul
          ref={listRef}
          id={styles.list}
          className={(open && styles.opened) || ""}
        >
          {Object.values(PacketType)
            .filter((v) => typeof v === "number")
            .map((packetType) => {
              return (
                // TODO: on click, open `What is {PacketType}?` modal.
                <li key={packetType} onClick={(e) => e.stopPropagation()}>
                  <div
                    className={styles.packet}
                    style={{
                      backgroundColor: OspfPacketColorMap.get(
                        packetType as PacketType
                      ),
                    }}
                  ></div>
                  <p>{getPacketTypeString(packetType as PacketType)} Packet</p>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
};
