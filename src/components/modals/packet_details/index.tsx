import React, { useLayoutEffect, useMemo, useState } from "react";
import { HelloPacket } from "../../../entities/ospf/packets";
import { PacketInteractive } from "./packet";
import styles from "./styles.module.css";
import { PacketType } from "src/entities/ospf/enum";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { getDDVizRows, getHelloVizRows } from "./descriptions/body";
import { HelloPacketBody } from "src/entities/ospf/packets/hello";
import { getHeaderRows } from "./descriptions/header";
import { IPPacket } from "src/entities/ip/packets";
import { DDPacketBody } from "src/entities/ospf/packets/dd";

interface PacketDetailModalProps {
  packet: IPPacket;
  modalRef: React.RefObject<HTMLDivElement>;
}
export const PacketDetailModalBody: React.FC<PacketDetailModalProps> = (
  props
) => {
  const { packet, modalRef } = props;
  const [fieldDesc, setFieldDesc] = useState("");
  const [descHeight, setDescHeight] = useState(0);
  const { body: ipBody } = packet || {};

  const headerRows = useMemo(() => {
    if (!(ipBody instanceof OSPFPacket)) {
      return [];
    }
    return getHeaderRows(ipBody.header);
  }, [ipBody]);

  const bodyRows = useMemo(() => {
    if (!(ipBody instanceof OSPFPacket)) {
      return [];
    }
    const { header, body } = ipBody;
    const { type } = header;
    switch (type) {
      case PacketType.Hello:
        return getHelloVizRows(body as HelloPacketBody);
      case PacketType.DD:
        return getDDVizRows(body as DDPacketBody);
      default:
        throw new Error("Not Implemented");
    }
  }, [ipBody]);

  useLayoutEffect(() => {
    // Set the height of the description box to the max possible height among all description strings.
    if (!bodyRows.length || !modalRef.current) {
      return;
    }
    let maxHeight = -1;
    [...headerRows, ...bodyRows].forEach(({ row }) => {
      row.forEach((field) => {
        const { description } = field;
        const container = document.createElement("div");
        container.classList.add(styles.desc);

        container.innerHTML = description;
        modalRef.current?.appendChild(container);
        const height = container.clientHeight;
        if (height > maxHeight) {
          maxHeight = height;
        }
        container.parentNode?.removeChild(container);
      });
    });
    setDescHeight(maxHeight);
  }, [headerRows, bodyRows, modalRef]);

  if (!ipBody) {
    return null;
  }
  return (
    <>
      <PacketInteractive
        packet={ipBody as HelloPacket}
        bodyRows={bodyRows}
        setFieldDesc={setFieldDesc}
      />
      <div className={styles.desc} style={{ height: descHeight }}>
        {(fieldDesc && (
          <div dangerouslySetInnerHTML={{ __html: fieldDesc }}></div>
        )) || (
          <p className={styles.hover_desc}>
            Hover over any field to learn about it.
          </p>
        )}
      </div>
    </>
  );
};
