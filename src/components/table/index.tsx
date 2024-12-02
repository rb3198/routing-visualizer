import { PropsWithChildren } from "react";
import styles from "./styles.module.css";

export const Table: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <table id={styles.table}>
      <tbody>{children}</tbody>
    </table>
  );
};
