import React, { PropsWithChildren } from "react";
import styles from "./styles.module.css";
import { CgClose } from "react-icons/cg";

type ModalProps = {
  title: string;
  visible?: boolean;
  modalRef?: React.LegacyRef<HTMLDivElement>;
  close: () => any;
};

export const Modal: React.FC<PropsWithChildren<ModalProps>> = (props) => {
  const { visible, title, close, children, modalRef } = props;
  return (
    <div id={styles.backdrop} className={visible ? styles.visible : ""}>
      <div
        id={styles.container}
        className={visible ? styles.visible : ""}
        ref={modalRef}
      >
        <div id={styles.title}>
          <h2>{title}</h2>
          <CgClose onClick={close} id={styles.close} />
        </div>
        <div id={styles.body}>{children}</div>
      </div>
    </div>
  );
};
