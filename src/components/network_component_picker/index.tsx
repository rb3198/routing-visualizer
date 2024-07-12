import React from "react";
import styles from "./style.module.css";

interface ComponentPickerProps {}

export const ComponentPicker: React.FC<ComponentPickerProps> = (props) => {
  return <div id={styles.container}></div>;
};
