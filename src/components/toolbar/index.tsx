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
import { IPLinkInterface } from "src/entities/ip/link_interface";
import { ConfigFile } from "src/entities/config";
import { getCellSize } from "src/utils/drawing";
import { downloadJson } from "src/utils/common";

interface IToolbarProps {
  startSimulation: () => boolean;
  pauseSimulation: () => any;
  stopSimulation: () => any;
  onConfigSave: () => any;
  onConfigChange: () => any;
  openLoadPopup: () => any;
  showTooltip?: (message: string) => any;
  onClear?: () => any;
  showClear?: boolean;
  areaTree: MutableRefObject<AreaTree>;
  linkInterfaceMap: MutableRefObject<Map<string, IPLinkInterface>>;
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
    linkInterfaceMap,
    showClear,
    onClear,
    onConfigSave,
    startSimulation,
    stopSimulation,
    setPropagationDelay,
    setMaxAge,
    setGlobalGracefulShutdown,
    showTooltip,
    setHelloInterval,
    openLoadPopup,
    onConfigChange,
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
        area.routerLocations
          .inOrderTraversal(area.routerLocations.root)
          .forEach(([, router]) => {
            router.ospf.config.helloInterval = helloInterval;
            router.ospf.config.deadInterval = deadInterval;
            router.ospf.config.MaxAge = MaxAge;
            router.ospf.config.LsRefreshTime = LsRefreshTime;
          })
      );
  }, [areaTree, helloInterval, MaxAge, LsRefreshTime, deadInterval]);

  const onPropDelayChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const { target } = e;
        const { value } = target;
        setPropagationDelay(parseFloat(value) * 1000);
        onConfigChange();
      },
      [setPropagationDelay, onConfigChange]
    );

  const onHelloIntervalChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const { target } = e;
        const { value } = target;
        setHelloInterval(parseFloat(value) * 1000);
        onConfigChange();
      },
      [setHelloInterval, onConfigChange]
    );

  const onMaxAgeChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const { target } = e;
        const { value } = target;
        setMaxAge(parseFloat(value) * 60);
        onConfigChange();
      },
      [setMaxAge, onConfigChange]
    );

  const resetPropDelay = useCallback(() => {
    setPropagationDelay(DEFAULT_PROPAGATION_DELAY);
    onConfigChange();
  }, [setPropagationDelay, onConfigChange]);

  const SimulationControls = useMemo(() => {
    const pauseImplemented = false;
    const onPlayPauseClick: MouseEventHandler<HTMLDivElement> = (e) => {
      e.stopPropagation();
      playing ? stopSimulation() : startSimulation();
    };
    return (
      <>
        <div onClick={onPlayPauseClick} className={styles.control}>
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
          <div className={styles.control} onClick={stopSimulation}>
            <FaStop color="black" />
          </div>
        )}
      </>
    );
  }, [playing, startSimulation, stopSimulation]);

  const LoadConfig = useMemo(() => {
    const onClick: MouseEventHandler = (e) => {
      e.stopPropagation();
      if (playing) {
        showTooltip &&
          showTooltip(
            `Cannot load a new configuration when the simulation is playing.
            Please STOP the simulation before loading a new config.`
          );
        return;
      }
      openLoadPopup();
    };
    return (
      <p
        className={styles.config_button}
        onClick={onClick}
        aria-disabled={!!playing}
        data-disabled={!!playing}
      >
        Load
      </p>
    );
  }, [playing, showTooltip, openLoadPopup]);

  const SaveConfig = useMemo(() => {
    const onSave: MouseEventHandler = (e) => {
      e.stopPropagation();
      const config = new ConfigFile(
        getCellSize(),
        {
          helloInterval,
          deadInterval,
          gracefulShutdown: globalGracefulShutdown,
          LsRefreshTime,
          MaxAge,
          propagationDelay,
          rxmtInterval,
        },
        areaTree.current,
        linkInterfaceMap.current
      );
      downloadJson(config, "network_visualizer.config.json");
      onConfigSave();
    };
    return (
      <p className={styles.config_button} onClick={onSave}>
        Save Current
      </p>
    );
  }, [
    helloInterval,
    deadInterval,
    globalGracefulShutdown,
    LsRefreshTime,
    MaxAge,
    propagationDelay,
    rxmtInterval,
    linkInterfaceMap,
    areaTree,
    onConfigSave,
  ]);

  const ClearConfig = useMemo(() => {
    if (!showClear) {
      return null;
    }
    const onClick: MouseEventHandler = (e) => {
      e.stopPropagation();
      if (playing) {
        showTooltip &&
          showTooltip(`Cannot clear the grid when the simulation is playing.
            Please STOP the simulation before clearing the grid.`);
        return;
      }
      onClear && onClear();
    };
    return (
      <p id={styles.clear} data-disabled={playing} onClick={onClick}>
        Clear
      </p>
    );
  }, [playing, showClear, onClear]);

  const ConfigButtons = useMemo(() => {
    return (
      <div id={styles.config_buttons_container}>
        Configuration:
        {ClearConfig}
        {SaveConfig}
        {LoadConfig}
        <div id={styles.expand_collapse_container}>
          <p>{expanded ? "Close " : "Edit "}</p>
          <MdKeyboardArrowUp
            id={styles.expand_collapse_arrow}
            data-expanded={expanded}
          />
        </div>
      </div>
    );
  }, [expanded, ClearConfig, LoadConfig, SaveConfig]);

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
    const { height } = configContent.getBoundingClientRect();
    contentHeight.current = height;
  }, []);

  const onGracefulToggle: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const { target } = e;
        const { checked } = target;
        areaTree.current
          .inOrderTraversal(areaTree.current.root)
          .forEach(([, area]) =>
            area.routerLocations
              .inOrderTraversal(area.routerLocations.root)
              .forEach(([, router]) => {
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
                description: `<ul>
                <li>Retransmission Interval, i.e. <code>RxmtInterval</code>, is the interval at which routers
                send each other Database Descriptions (DD), Link State Requests, and Link State Updates.</li>
                <li>These packets continue to be sent on every <code>RxmtInterval</code> seconds till 
                they're acknowledged, or the next desired state is achieved.</li>
                <li>It is typically set to a value well above the typical round-trip delay
                <br><code>(2 * propagation delay)</code> between any two routers.</li>
                `,
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
            transmission of two consecutive Hello packets.<br>
            Ex: If hello interval is set to 10s, then every router would send 
            a hello packet to each of its neighbors every 10s to let them know that its alive.`,
            value: helloInterval / 1000,
            affects: [
              {
                label: "Dead Interval",
                value: deadInterval / 1000,
                description: `
                <ul>
                  <li>Hello packets are used to communicate the liveliness of routers to their neighbors.</li>
                  <li>Dead Interval also known as <code>RouterDeadInterval</code> is the 
                  number of seconds that a router waits for a hello packet before declaring its neighbor to be down.
                  </li>
                  <li>It is typically set to a multiple (typically 4) of the hello interval.</li>
                </ul>
                `,
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
                description: `
                <ul>
                  <li>If the <code>LSAge</code> field of one of the router's self-originated
                  LSAs reaches the value <code>LSRefreshTime</code>, a new instance of the LSA
                  is originated, even though the contents of the LSA (apart from
                  the LSA header) will be the same.</li>
                  <li>This is done to ensure the freshness of LSAs.</li>
                  <li>The value of LSRefreshTime is set to half of the <code>MaxAge</code>.</li>
                </ul>
                `,
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
        {ConfigButtons}
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
