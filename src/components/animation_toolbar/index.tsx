import React from "react";
import styles from "./styles.module.css";
import { FaPause, FaPlay, FaStop } from "react-icons/fa";
import { getRxmtInterval } from "src/entities/ospf/constants";

interface AnimationToolbarProps {
  startSimulation: () => boolean;
  pauseSimulation: () => any;
  propagationDelay: number;
  setPropagationDelay: (delay: number) => any;
  showTooltip?: (message: string) => any;
  playing?: boolean;
}

export const AnimationToolbar: React.FC<AnimationToolbarProps> = (props) => {
  const {
    playing,
    propagationDelay,
    startSimulation,
    pauseSimulation,
    setPropagationDelay,
    showTooltip,
  } = props;

  const togglePlaying = () => {
    if (playing) {
      pauseSimulation();
    } else {
      startSimulation();
    }
  };

  const onPropDelayChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { target } = e;
    const { value } = target;
    setPropagationDelay(parseFloat(value) * 1000);
  };

  const onDisabledSliderInteract = () =>
    showTooltip &&
    showTooltip(
      "Cannot Change the propagation delay once the simulation has started. Please STOP the simulation to change this delay."
    );

  return (
    <div id={styles.container}>
      <div onClick={togglePlaying}>
        {playing ? <FaPause color="black" /> : <FaPlay color="black" />}
      </div>
      <div>
        <FaStop color="black" />
      </div>
      <div id={styles.prop_slider_container}>
        <label htmlFor={styles.prop_slider} className={styles.delay_label}>
          <p>Propagation Delay:</p>
          <span>{(propagationDelay / 1000).toFixed(1)}s</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          step={0.1}
          value={propagationDelay / 1000}
          id={styles.prop_slider}
          onChange={onPropDelayChange}
          disabled={playing}
        />
        {playing && (
          <div
            id={styles.disabled_slider_overlay}
            onMouseDown={onDisabledSliderInteract}
          />
        )}
      </div>
      <div>
        <label htmlFor={styles.prop_slider} className={styles.delay_label}>
          <p>Retransmission Interval:</p>
          <span>{(getRxmtInterval(propagationDelay) / 1000).toFixed(1)}s</span>
        </label>
      </div>
    </div>
  );
};
