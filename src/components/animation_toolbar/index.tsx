import React, { useCallback, useState } from "react";
import styles from "./styles.module.css";
import {
  FaFastBackward,
  FaFastForward,
  FaPause,
  FaPlay,
  FaStop,
} from "react-icons/fa";

interface AnimationToolbarProps {
  startSimulation: () => boolean;
}

export const AnimationToolbar: React.FC<AnimationToolbarProps> = (props) => {
  const { startSimulation } = props;
  const [playing, setPlaying] = useState(false);

  const togglePlaying = useCallback(() => {
    setPlaying((playing) => {
      const newState = !playing;
      if (newState) {
        return startSimulation();
      }
      return newState;
    });
  }, [startSimulation]);
  return (
    <div id={styles.container}>
      <div onClick={togglePlaying}>
        {playing ? <FaPause color="black" /> : <FaPlay color="black" />}
      </div>
      <div>
        <FaStop color="black" />
      </div>
      <div>
        <FaFastBackward color="black" />
      </div>
      <div>
        <FaFastForward color="black" />
      </div>
    </div>
  );
};
