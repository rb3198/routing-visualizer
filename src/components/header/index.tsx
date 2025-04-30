import React from "react";
import styles from "./style.module.css";
import { HeaderIcon } from "../icons/HeaderIcon";
import { TutorialScreen } from "src/types/welcome_tutorial/screen";

export interface HeaderProps {
  openTutorial: (
    tutScreen: TutorialScreen,
    writeToStorage?: boolean
  ) => unknown;
}

export const Header: React.FC<HeaderProps> = (props) => {
  const { openTutorial } = props;

  const onAboutOspfClick = () => openTutorial(TutorialScreen.OSPFIntro);
  const onHowToUseClick = () => openTutorial(TutorialScreen.VisualizerTutorial);

  return (
    <header id={styles.header}>
      <div id={styles.header_title}>
        <HeaderIcon color="white" />
        <h2>OSPF Visualizer</h2>
      </div>
      <nav>
        <ul>
          {/* Open the Welcome Screen */}
          <li onClick={onAboutOspfClick}>About OSPF</li>
          {/* Open a modal showing a step by step tutorial */}
          <li onClick={onHowToUseClick}>How to Use</li>
        </ul>
      </nav>
    </header>
  );
};
