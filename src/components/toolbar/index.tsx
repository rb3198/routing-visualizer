import React, {
  MouseEventHandler,
  MutableRefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./styles.module.css";
import { FaPause, FaPlay, FaStop } from "react-icons/fa";
import { MdKeyboardArrowUp } from "react-icons/md";
import { ConfigOption, ConfigOptionProps } from "./config_option";
import { DEFAULT_PROPAGATION_DELAY } from "src/entities/ospf/config/ospf_globals";
import { IRootReducer } from "src/reducers";
import { bindActionCreators, Dispatch } from "redux";
import { connect, ConnectedProps } from "react-redux";
import {
  setGlobalGracefulShutdown,
  setHelloInterval,
  setMaxAge,
  setPropagationDelay,
} from "src/action_creators";
import { AreaTree } from "src/entities/area_tree";
import { DEFAULT_HELLO_INTERVAL } from "src/entities/ospf/constants";

interface IToolbarProps {
  startSimulation: () => boolean;
  pauseSimulation: () => any;
  showTooltip?: (message: string) => any;
  areaTree: MutableRefObject<AreaTree>;
  playing?: boolean;
}

type ToolbarProps = IToolbarProps & ConnectedProps<typeof connector>;

const ToolbarComponent: React.FC<ToolbarProps> = (props) => {
  const {
    playing,
    propagationDelay,
    gracefulShutdown: globalGracefulShutdown,
    helloInterval,
    deadInterval,
    rxmtInterval,
    MaxAge,
    LsRefreshTime,
    areaTree,
    startSimulation,
    pauseSimulation,
    setPropagationDelay,
    setMaxAge,
    setGlobalGracefulShutdown,
    showTooltip,
    setHelloInterval,
  } = props;

  const [expanded, setExpanded] = useState(false);
  const configContainerRef = useRef<HTMLDivElement>(null);
  const configContentRef = useRef<HTMLDivElement>(null);
  const contentHeight = useRef(0);

  useEffect(() => {
    if (!areaTree.current) {
      return;
    }
    areaTree.current
      .inOrderTraversal(areaTree.current.root)
      .forEach(([, area]) => {
        area.setRxmtInterval(rxmtInterval);
      });
  }, [rxmtInterval, areaTree]);

  useEffect(() => {
    areaTree.current
      .inOrderTraversal(areaTree.current.root)
      .forEach(([, area]) =>
        area.routerLocations.forEach((router) => {
          router.ospf.config.helloInterval = helloInterval;
          router.ospf.config.deadInterval = deadInterval;
        })
      );
  }, [areaTree, helloInterval, deadInterval]);

  useEffect(() => {
    areaTree.current
      .inOrderTraversal(areaTree.current.root)
      .forEach(([, area]) =>
        area.routerLocations.forEach((router) => {
          router.ospf.config.MaxAge = MaxAge;
          router.ospf.config.LsRefreshTime = LsRefreshTime;
        })
      );
  }, [areaTree, MaxAge, LsRefreshTime]);

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

  const onHelloIntervalChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const { target } = e;
        const { value } = target;
        setHelloInterval(parseFloat(value) * 1000);
      },
      [setHelloInterval]
    );

  const onMaxAgeChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const { target } = e;
        const { value } = target;
        setMaxAge(parseFloat(value) * 60);
      },
      [setMaxAge]
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

  const onGracefulToggle: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const { target } = e;
        const { checked } = target;
        areaTree.current
          .inOrderTraversal(areaTree.current.root)
          .forEach(([, area]) =>
            area.routerLocations.forEach((router) => {
              router.gracefulShutdown = checked;
            })
          );
        setGlobalGracefulShutdown(checked);
      },
      [areaTree, setGlobalGracefulShutdown]
    );

  const ConfigTools = useMemo(() => {
    const onDisabledMouseDown = (propName: string) => {
      showTooltip?.call(
        null,
        `Cannot change the ${propName} once the simulation has started. Please STOP the simulation to change this delay.`
      );
    };
    const config: ConfigOptionProps[] = [
      {
        section: "Packet Transmission Config",
        params: [
          {
            type: "range",
            description: `Propagation Delay is the time taken by a link to transport a packet from router A to router B.\n
            Ex: If propagation delay is 10s and router A transmits a packet,
            then it would take 10 seconds for the packet to reach router B.`,
            label: "Propagation Delay",
            value: propagationDelay / 1000,
            unit: "s",
            step: 0.1,
            onChange: onPropDelayChange,
            affects: [
              {
                label: "Retransmission Interval",
                value: rxmtInterval / 1000,
              },
            ],
            onReset: resetPropDelay,
            range: [1, 5],
            disabled: playing,
            onDisabledClick: onDisabledMouseDown,
          },
        ],
      },
      {
        section: "Default Router Behavior",
        params: [
          {
            type: "checkbox",
            description: `If enabled, the router ages its LSAs to MaxAge (hence making the LSAs unusable)
            and transmits them to its neighbors before shutting down.
            This way, all the neighbors know the unavailability of the router in advance, 
            and update their tables accordingly before the router actually shuts down. This
            prevents the network from experiencing "shocks", i.e. packets being transported through unusable routes.`,
            checked: globalGracefulShutdown,
            disabled: playing,
            label: "Shutdown Gracefully",
            onToggle: onGracefulToggle,
          },
        ],
      },
      {
        section: "OSPF Configuration",
        params: [
          {
            type: "range",
            range: [8, 20],
            description: `Dictates the interval between the 
            transmission of two consecutive Hello packets.\n
            Ex: If helloInterval is set to 10s, then every router would send 
            a hello packet to each of its neighbors every 10s to let them know that its alive.`,
            value: helloInterval / 1000,
            affects: [
              {
                label: "Dead Interval",
                value: deadInterval / 1000,
              },
            ],
            label: "Hello Interval",
            onChange: onHelloIntervalChange,
            onDisabledClick: onDisabledMouseDown,
            onReset: setHelloInterval.bind(null, DEFAULT_HELLO_INTERVAL),
            step: 0.2,
            unit: "s",
            disabled: playing,
          },
          {
            type: "range",
            range: [2, 60],
            description: `
            The maximum age that an LSA can attain. When an LSA's LS age field reaches MaxAge,
            it is re-flooded in an attempt to flush the LSA from the routing domain.
            `,
            value: MaxAge / 60,
            label: "LSA Max Age",
            onChange: onMaxAgeChange,
            onReset: () => setMaxAge(),
            step: 2,
            unit: "m",
            disabled: playing,
            onDisabledClick: onDisabledMouseDown,
            affects: [
              {
                label: "LSA Refresh Time",
                value: LsRefreshTime / 60,
              },
            ],
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
    rxmtInterval,
    helloInterval,
    deadInterval,
    MaxAge,
    LsRefreshTime,
    globalGracefulShutdown,
    onPropDelayChange,
    resetPropDelay,
    playing,
    showTooltip,
    onGracefulToggle,
    setHelloInterval,
    onHelloIntervalChange,
    onMaxAgeChange,
    setMaxAge,
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

const mapStateToProps = (state: IRootReducer) => {
  const { simulationConfig } = state;
  return { ...simulationConfig };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setPropagationDelay: bindActionCreators(setPropagationDelay, dispatch),
    setHelloInterval: bindActionCreators(setHelloInterval, dispatch),
    setMaxAge: bindActionCreators(setMaxAge, dispatch),
    setGlobalGracefulShutdown: bindActionCreators(
      setGlobalGracefulShutdown,
      dispatch
    ),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);
export const Toolbar = connector(ToolbarComponent);
