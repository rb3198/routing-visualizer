import React, {
  KeyboardEventHandler,
  PropsWithChildren,
  useCallback,
  useEffect,
  RefObject,
} from "react";
import styles from "./styles.module.css";
import { CgClose } from "react-icons/cg";

type ModalProps = {
  title: string;
  visible?: boolean;
  modalRef?: RefObject<HTMLDivElement>;
  classes?: string;
  close: () => any;
};

export const Modal: React.FC<PropsWithChildren<ModalProps>> = (props) => {
  const { visible, title, close, children, classes, modalRef } = props;
  const onBackdropClick: React.MouseEventHandler = useCallback(
    (e) => {
      const { target, currentTarget } = e;
      currentTarget === target && close();
    },
    [close]
  );

  const onKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      e.key === "Escape" && close();
    },
    [close]
  );

  useEffect(() => {
    const { current } = modalRef || {};
    visible && current?.focus();
    return () => {
      current?.blur();
    };
  }, [visible, modalRef]);
  return (
    <div
      id={styles.backdrop}
      className={visible ? styles.visible : ""}
      onClick={onBackdropClick}
    >
      <div
        tabIndex={0}
        id={styles.container}
        className={`${classes || ""} ${visible ? styles.visible : ""}`}
        ref={modalRef}
        onKeyDown={onKeyDown}
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
