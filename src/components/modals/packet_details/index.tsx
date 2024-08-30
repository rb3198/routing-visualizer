import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Modal } from "..";
import { IRootReducer } from "../../../reducers";
import { connect, ConnectedProps } from "react-redux";
import { HelloPacket } from "../../../entities/ospf/packets";
import { bindActionCreators, Dispatch } from "redux";
import { closeModal } from "../../../action_creators";
import { PacketInteractive } from "./packet";
import styles from "./styles.module.css";
import { PacketType } from "src/entities/ospf/enum";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { getHelloVizRows } from "./descriptions/body";
import { HelloPacketBody } from "src/entities/ospf/packets/hello";
import { getHeaderRows } from "./descriptions/header";

type ReduxProps = ConnectedProps<typeof connector>;
const PacketDetailModalComponent: React.FC<ReduxProps> = (props) => {
  const { modal, close } = props;
  const modalRef = useRef<HTMLDivElement>(null);
  const [fieldDesc, setFieldDesc] = useState("");
  const [descHeight, setDescHeight] = useState(0);
  const { active, data } = modal;
  const { header: ipHeader, body: ipBody } = data || {};
  const { id } = ipHeader || {};

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
    [...headerRows, ...bodyRows].forEach((row) => {
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
  }, [headerRows, bodyRows]);

  if (!ipBody) {
    return null;
  }
  return (
    <Modal
      visible={active === "packet"}
      close={close}
      title={`Hello Packet (ID ${id})`}
      modalRef={modalRef}
    >
      <PacketInteractive
        packet={ipBody as HelloPacket}
        bodyRows={bodyRows}
        setFieldDesc={setFieldDesc}
      />
      <div className={styles.desc} style={{ height: descHeight }}>
        {(fieldDesc && (
          <p dangerouslySetInnerHTML={{ __html: fieldDesc }}></p>
        )) || (
          <p className={styles.hover_desc}>
            Hover over any field to learn about it.
          </p>
        )}
      </div>
    </Modal>
  );
};

const mapStateToProps = (state: IRootReducer) => {
  const { modalState } = state;
  return {
    modal: modalState,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    close: bindActionCreators(closeModal, dispatch),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const PacketDetailModal = connector(PacketDetailModalComponent);
