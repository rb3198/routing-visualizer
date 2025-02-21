import React, {
  MouseEventHandler,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./styles.module.css";
import { FaPause, FaPlay, FaStop } from "react-icons/fa";
import { getRxmtInterval } from "src/entities/ospf/constants";
import { MdKeyboardArrowUp } from "react-icons/md";
import { ConfigOption, ConfigOptionProps } from "./config_option";
import { DEFAULT_PROPAGATION_DELAY } from "src/reducers/propagation_delay";

interface ToolbarProps {
  startSimulation: () => boolean;
  pauseSimulation: () => any;
  propagationDelay: number;
  setPropagationDelay: (delay: number) => any;
  showTooltip?: (message: string) => any;
  playing?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = (props) => {
  const {
    playing,
    propagationDelay,
    startSimulation,
    pauseSimulation,
    setPropagationDelay,
    showTooltip,
  } = props;

  const [expanded, setExpanded] = useState(false);
  const configContainerRef = useRef<HTMLDivElement>(null);
  const configContentRef = useRef<HTMLDivElement>(null);
  const contentHeight = useRef(0);

  const togglePlaying: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.stopPropagation();
      if (playing) {
        pauseSimulation();
      } else {
        startSimulation();
      }
    },
    [playing, pauseSimulation, startSimulation]
  );

  const onPropDelayChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const { target } = e;
        const { value } = target;
        setPropagationDelay(parseFloat(value) * 1000);
      },
      [setPropagationDelay]
    );

  const resetPropDelay = useCallback(
    () => setPropagationDelay(DEFAULT_PROPAGATION_DELAY),
    [setPropagationDelay]
  );

  const SimulationControls = useMemo(() => {
    const pauseImplemented = false;
    return (
      <>
        <div onClick={togglePlaying} className={styles.control}>
          {playing ? (
            pauseImplemented ? (
              <FaPause color="black" />
            ) : (
              <FaStop color="black" />
            )
          ) : (
            <FaPlay color="black" />
          )}
        </div>
        {pauseImplemented && (
          <div className={styles.control}>
            <FaStop color="black" />
          </div>
        )}
      </>
    );
  }, [playing, togglePlaying]);

  const ExpandConfig = useMemo(() => {
    return (
      <div id={styles.expand_collapse_container}>
        {expanded ? "Close " : "Open "}
        Configuration
        <MdKeyboardArrowUp
          id={styles.expand_collapse_arrow}
          data-expanded={expanded}
        />
      </div>
    );
  }, [expanded]);

  const toggleExpanded = useCallback(
    () =>
      setExpanded((prv) => {
        if (configContainerRef.current) {
          configContainerRef.current.style.maxHeight = !prv
            ? `${contentHeight.current}px`
            : `0px`;
        }
        return !prv;
      }),
    []
  );

  useLayoutEffect(() => {
    if (!configContentRef.current || !configContainerRef.current) {
      return;
    }
    const configContent = configContentRef.current;
    const { height, width } = configContent.getBoundingClientRect();
    contentHeight.current = height;
    configContainerRef.current.style.width = `${width}px`;
    const resizeListener = function (this: HTMLDivElement) {
      const { height, width } = this.getBoundingClientRect();
      if (configContainerRef.current) {
        contentHeight.current = height;
        configContainerRef.current.style.height = `${height}px`;
        configContainerRef.current.style.width = `${width}px`;
      }
    };
    configContent.addEventListener("resize", resizeListener);
    return () => {
      configContent.removeEventListener("resize", resizeListener);
    };
  }, []);

  const ConfigTools = useMemo(() => {
    const onDisabledMouseDown = () => {
      showTooltip?.call(
        null,
        "Cannot Change the propagation delay once the simulation has started. Please STOP the simulation to change this delay."
      );
    };
    const config: ConfigOptionProps[] = [
      {
        section: "Packet Transmission Config",
        params: [
          {
            label: "Propagation Delay:",
            value: propagationDelay / 1000,
            unit: "s",
            step: 0.1,
            onChange: onPropDelayChange,
            affects: [
              {
                label: "Retransmission Interval:",
                value: getRxmtInterval(propagationDelay) / 1000,
              },
            ],
            onReset: resetPropDelay,
            range: [1, 5],
            disabled: playing,
            onDisabledClick: onDisabledMouseDown,
          },
        ],
      },
    ];
    return (
      <div
        id={styles.config_container}
        data-expanded={expanded}
        ref={configContainerRef}
      >
        <div ref={configContentRef} id={styles.config_content}>
          {config.map((config) => (
            <ConfigOption {...config} key={config.section} />
          ))}
        </div>
      </div>
    );
  }, [
    expanded,
    propagationDelay,
    onPropDelayChange,
    resetPropDelay,
    playing,
    showTooltip,
  ]);

  return (
    <div id={styles.container}>
      {ConfigTools}
      <div id={styles.controls_container} onClick={toggleExpanded}>
        {SimulationControls}
        {ExpandConfig}
      </div>
    </div>
  );
};
