import React from "react";
import styles from "./style.module.css";
import { HeaderIcon } from "../icons/HeaderIcon";
import { TutorialScreen } from "src/types/tutorials/screen";
import { useNavigate } from "react-router";
import { AppRoutes } from "src/constants/app_routes";

export interface HeaderProps {
  setTutorialScreen: (tutScreen: TutorialScreen) => unknown;
}

export const Header: React.FC<HeaderProps> = (props) => {
  const { setTutorialScreen } = props;
  const navigate = useNavigate();
  const onNetworkClick = () => {
    navigate(AppRoutes.Tutorials);
  };
  const onHowToUseClick = () =>
    setTutorialScreen(TutorialScreen.VisualizerTutorial);
  const onTitleClick = () => navigate("/");
  return (
    <header id={styles.header}>
      <div id={styles.header_title} onClick={onTitleClick}>
        <HeaderIcon color="white" />
        <h2>OSPF Visualizer</h2>
      </div>
      <nav>
        <ul>
          {/* Open a modal showing a step by step tutorial */}
          <li onClick={onHowToUseClick}>How to Use</li>
          {/* Open Tutorials */}
          <li onClick={onNetworkClick}>Networking Tutorials</li>
        </ul>
      </nav>
    </header>
  );
};
