import React, { memo, useMemo } from "react";
import styles from "./styles.module.css";
import { CiRouter, CiViewTable } from "react-icons/ci";
import { Router } from "../../entities/router";
import { PiPower } from "react-icons/pi";

export interface ConnectionPickerProps {
  selectedRouter?: Router;
  visible?: boolean;
  pickerRef?: React.LegacyRef<HTMLDivElement>;
  position: {
    top?: number | string;
    left?: number | string;
    bottom?: number | string;
  };
  connectionOptions: {
    name: string;
    connectionOptions: [string, Router][];
  }[];
  controlsDisabled?: boolean;
  openNeighborTable: (router: Router) => unknown;
  addRouterConnection?: (routerA: Router, routerB: Router) => any;
  /**
   * Turns the router ON or OFF.
   */
  toggleRouterPower?: (router: Router) => unknown;
}

/**
 * Component to display options to connect a router to other routers.
 * @param props
 * @returns
 */
export const RouterMenu: React.FC<ConnectionPickerProps> = (props) => {
  const {
    visible,
    position,
    pickerRef,
    connectionOptions,
    selectedRouter,
    controlsDisabled,
    openNeighborTable,
    addRouterConnection,
    toggleRouterPower,
  } = props;

  const Controls = useMemo(() => {
    const { turnedOn } = selectedRouter || {};
    const onClick = () => {
      toggleRouterPower && selectedRouter && toggleRouterPower(selectedRouter);
    };
    return (
      <div
        id={styles.controls_container}
        onClick={onClick}
        data-disabled={controlsDisabled}
      >
        <div id={styles.power_icon} data-turned-on={turnedOn}>
          <PiPower />
        </div>
        Turn {turnedOn ? "Off" : "On"}
      </div>
    );
  }, [selectedRouter, controlsDisabled, toggleRouterPower]);

  const Tables = useMemo(() => {
    const onNeighborTableClick = () => {
      selectedRouter && openNeighborTable(selectedRouter);
    };
    return (
      <>
        <p className={styles.description}>View...</p>
        <ul>
          <li onClick={onNeighborTableClick}>
            <div className={styles.iconContainer}>
              <CiViewTable className={styles.icon} />
            </div>
            Neighbor Table
          </li>
          <li onClick={() => {}}>
            <div className={styles.iconContainer}>
              <CiViewTable className={styles.icon} />
            </div>
            Routing Table
          </li>
        </ul>
      </>
    );
  }, [selectedRouter, openNeighborTable]);
  const { top, left, bottom } = position;
  return (
    <div
      ref={pickerRef}
      id={styles.container}
      style={{
        zIndex: visible ? 100 : -1,
        opacity: visible ? 1 : 0,
        top,
        left,
        bottom,
      }}
    >
      {Controls}
      {Tables}
      {(connectionOptions.length > 0 && (
        <>
          <p className={styles.description}>Connect to...</p>
          {connectionOptions.map(({ name, connectionOptions }) => {
            return (
              <React.Fragment key={`connection_picker_${name}`}>
                <p className={`${styles.as_name} ${styles.description}`}>
                  {name}
                </p>
                <ul>
                  {connectionOptions.map(([loc, router]) => (
                    <Connection
                      loc={loc}
                      router={router}
                      key={`r_picker_${loc}`}
                      rootRouter={selectedRouter}
                      addRouterConnection={addRouterConnection}
                    />
                  ))}
                </ul>
              </React.Fragment>
            );
          })}
        </>
      )) || <></>}
    </div>
  );
};

interface ConnectionProps {
  loc: string;
  rootRouter?: Router;
  router: Router;
  addRouterConnection?: (routerA: Router, routerB: Router) => any;
}

const Connection: React.FC<ConnectionProps> = memo(
  ({ loc, router, rootRouter, addRouterConnection }) => {
    const onClick = () => {
      if (rootRouter) {
        addRouterConnection && addRouterConnection(rootRouter, router);
      }
    };
    return (
      <li key={`router_${loc}`} onClick={onClick}>
        <div className={styles.iconContainer}>
          <CiRouter className={styles.icon} />
        </div>
        {router.id.ip}
      </li>
    );
  }
);