import { PropsWithChildren } from "react";
import styles from "./styles.module.css";

export const Table: React.FC<PropsWithChildren<{ classes?: string }>> = ({
  classes,
  children,
}) => {
  return (
    <table id={styles.table} className={classes}>
      <tbody>{children}</tbody>
    </table>
  );
};
