import React from "react";
import styles from "./styles.module.css";
import { FaPause, FaPlay, FaStop } from "react-icons/fa";

interface AnimationToolbarProps {
  startSimulation: () => boolean;
  pauseSimulation: () => any;
  playing?: boolean;
}

export const AnimationToolbar: React.FC<AnimationToolbarProps> = (props) => {
  const { playing, startSimulation, pauseSimulation } = props;

  const togglePlaying = () => {
    if (playing) {
      pauseSimulation();
    } else {
      startSimulation();
    }
  };
  return (
    <div id={styles.container}>
      <div onClick={togglePlaying}>
        {playing ? <FaPause color="black" /> : <FaPlay color="black" />}
      </div>
      <div>
        <FaStop color="black" />
      </div>
    </div>
  );
};
