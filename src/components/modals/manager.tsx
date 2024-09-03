import React, { useCallback, useMemo, useRef } from "react";
import { Modal } from ".";
import { IRootReducer } from "src/reducers";
import { bindActionCreators, Dispatch } from "redux";
import { closeModal } from "src/action_creators";
import { connect, ConnectedProps } from "react-redux";
import { PacketDetailModalBody } from "./packet_details";
import { IPPacket } from "src/entities/ip/packets";
import { NeighborTableModalBody } from "./neighbor_table";
import { NeighborTableEvent } from "src/entities/network_event/neighbor_table_event";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { getKey } from "src/utils/common";
import { PacketType } from "src/entities/ospf/enum";

type ReduxProps = ConnectedProps<typeof connector>;

const Manager: React.FC<ReduxProps> = (props) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { active, data, close } = props;
  const visible = active !== "none";

  const title = useMemo(() => {
    switch (active) {
      case "packet":
        const { header, body } = data as IPPacket;
        const { id } = header;
        return `${
          body instanceof OSPFPacket ? getKey(PacketType, body.header.type) : ""
        } Packet (ID ${id})`;
      case "neighbor_table":
        const { routerId, timestamp } = data as NeighborTableEvent;
        return `${routerId}'s Neighbor Table Snapshot at ${new Date(
          timestamp
        ).toLocaleTimeString()}`;
      default:
        return "";
    }
  }, [active, data]);

  const renderModalBody = useCallback(() => {
    switch (active) {
      case "packet":
        return (
          <PacketDetailModalBody
            modalRef={modalRef}
            packet={data as IPPacket}
          />
        );
      case "neighbor_table":
        return (
          <NeighborTableModalBody
            event={data as NeighborTableEvent}
            modalRef={modalRef}
          />
        );
      default:
        return null;
    }
  }, [active, data]);

  return (
    <Modal visible={visible} close={close} title={title} modalRef={modalRef}>
      {renderModalBody()}
    </Modal>
  );
};

const mapStateToProps = (state: IRootReducer) => {
  const { modalState } = state;
  const { active, data } = modalState;
  return { active, data };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    close: bindActionCreators(closeModal, dispatch),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const ModalManager = connector(Manager);
