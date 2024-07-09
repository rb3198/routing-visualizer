import React from "react";
import styles from "./style.module.css";

interface HeaderProps {}

export const Header: React.FC<HeaderProps> = (props) => {
  return (
    <header id={styles["header"]}>
      <h2 id={styles["header-title"]}>Routing Visualizer</h2>
      <nav>
        <ul>
          {/* Open a modal showing a step by step tutorial */}
          <li>Tutorial</li>
          {/* Open a modal showing a list of presets */}
          <li>Presets</li>
          {/* Open a modal giving the option to load a json file describing the setup */}
          <li>Load a Config</li>
        </ul>
      </nav>
    </header>
  );
};
