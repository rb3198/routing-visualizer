import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { HelloPacket } from "../../../entities/ospf/packets";
import { PacketInteractive } from "./packet";
import styles from "./styles.module.css";
import { PacketType } from "src/entities/ospf/enum";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import {
  getDDVizRows,
  getHelloVizRows,
  getLSAckRows,
  getLSRequestRows,
  getLSUpdateRows,
} from "./descriptions/body";
import { HelloPacketBody } from "src/entities/ospf/packets/hello";
import { getHeaderRows } from "./descriptions/header";
import { IPPacket } from "src/entities/ip/packets";
import { DDPacketBody } from "src/entities/ospf/packets/dd";
import { LSRequest } from "src/entities/ospf/packets/ls_request";
import { LSAHeader } from "src/entities/ospf/lsa";
import { LSUpdatePacketBody } from "src/entities/ospf/packets/ls_update";

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
  const hoverPRef = useRef<HTMLParagraphElement>(null);
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
      case PacketType.LinkStateRequest:
        return getLSRequestRows(body as LSRequest[]);
      case PacketType.LinkStateUpdate:
        return getLSUpdateRows(body as LSUpdatePacketBody);
      case PacketType.LinkStateAck:
        return getLSAckRows(body as LSAHeader[]);
      default:
        throw new Error("Not Implemented");
    }
  }, [ipBody]);

  useLayoutEffect(() => {
    // Set the height of the description box to the max possible height among all description strings.
    if (!bodyRows.length || !modalRef.current || !hoverPRef.current) {
      return;
    }
    let maxHeight = -1;
    const pParent = hoverPRef.current.parentNode;
    pParent?.removeChild(hoverPRef.current);

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
    pParent?.appendChild(hoverPRef.current);
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
          <p className={styles.hover_desc} ref={hoverPRef}>
            Hover over any field to learn about it.
          </p>
        )}
      </div>
    </>
  );
};
