import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";
import { CiRouter, CiViewTable } from "react-icons/ci";
import { Router } from "../../entities/router";
import { PiPathFill, PiPowerDuotone } from "react-icons/pi";
import { GoDatabase } from "react-icons/go";
import { LsDb } from "src/entities/router/ospf_interface/ls_db";
import { AreaTree } from "src/entities/area_tree";
import { BACKBONE_AREA_ID } from "src/entities/ospf/constants";
import { Point2D } from "src/types/geometry";
import { GridCell } from "src/entities/geometry/grid_cell";
import { usePickerPosition } from "../hooks/usePickerPosition";
import { RouterPowerState } from "src/entities/router/enum/RouterPowerState";

export interface RouterMenuProps {
  cell: Point2D;
  gridRect: GridCell[][];
  areaTreeRef: React.MutableRefObject<AreaTree>;
  areaLayerRef: React.RefObject<HTMLCanvasElement>;
  selectedRouter?: Router;
  visible?: boolean;
  pickerRef?: React.RefObject<HTMLDivElement>;
  controlsDisabled?: boolean;
  openNeighborTable: (router: Router) => unknown;
  openLsDbModal: (lsDb: LsDb) => any;
  openRoutingTable: (router: Router) => unknown;
  enableDestSelectionMode: (selecting: boolean) => unknown;
  addRouterConnection?: (routerA: Router, routerB: Router) => any;
  /**
   * Turns the router ON or OFF.
   */
  onRouterInteractionComplete: () => unknown;
}

/**
 * Component to display options to connect a router to other routers.
 * @param props
 * @returns
 */
export const RouterMenu: React.FC<RouterMenuProps> = memo((props) => {
  const {
    cell,
    gridRect,
    areaLayerRef,
    visible,
    pickerRef,
    areaTreeRef,
    selectedRouter,
    controlsDisabled,
    openNeighborTable,
    openLsDbModal,
    addRouterConnection,
    enableDestSelectionMode,
    openRoutingTable,
    onRouterInteractionComplete,
  } = props;

  const [position, zIndex] = usePickerPosition({
    visible,
    cell,
    gridRect,
    picker: pickerRef?.current,
    canvas: areaLayerRef?.current,
  });

  const [routerPower, setRouterPower] = useState<RouterPowerState>(
    selectedRouter?.power || RouterPowerState.Shutdown
  );
  const [gracefulShutdown, setGracefulShutdown] = useState<boolean>(
    selectedRouter?.gracefulShutdown ?? false
  );

  useEffect(() => {
    selectedRouter && setGracefulShutdown(selectedRouter.gracefulShutdown);
  }, [selectedRouter]);

  const Controls = useMemo(() => {
    const onPowerClick = async () => {
      if (!selectedRouter) return;
      const { turnOff, turnOn } = selectedRouter;
      switch (routerPower) {
        case RouterPowerState.Shutdown:
          turnOn();
          setRouterPower(RouterPowerState.On);
          break;
        case RouterPowerState.On:
          setRouterPower(RouterPowerState.ShuttingDown);
          await turnOff();
          setRouterPower(RouterPowerState.Shutdown);
          break;
        default:
          break;
      }
      onRouterInteractionComplete();
    };

    const onCheckboxClick = () => {
      if (!selectedRouter || selectedRouter.power !== RouterPowerState.On) {
        return;
      }
      selectedRouter.gracefulShutdown = !selectedRouter.gracefulShutdown;
      setGracefulShutdown(selectedRouter.gracefulShutdown);
    };
    return (
      <div id={styles.controls_container}>
        <div id={styles.power_container} onClick={onPowerClick}>
          <PiPowerDuotone id={styles.power_icon} data-status={routerPower} />
          Turn
          {routerPower === RouterPowerState.On
            ? " Off"
            : routerPower === RouterPowerState.ShuttingDown
            ? "ing Off"
            : " On"}
        </div>
        <div
          id={styles.graceful_container}
          data-applicable={routerPower === RouterPowerState.On}
        >
          <label
            htmlFor={styles.graceful_checkbox}
            className={styles.graceful_label}
          >
            Gracefully
          </label>
          <input
            type="checkbox"
            id={styles.graceful_checkbox}
            checked={gracefulShutdown}
            onChange={onCheckboxClick}
          />
        </div>
      </div>
    );
  }, [
    selectedRouter,
    gracefulShutdown,
    routerPower,
    onRouterInteractionComplete,
  ]);

  const openLsDb = useCallback(() => {
    if (!selectedRouter) {
      return;
    }
    const { ospf } = selectedRouter;
    const { lsDb } = ospf;
    openLsDbModal(lsDb);
  }, [selectedRouter, openLsDbModal]);

  const Data = useMemo(() => {
    const onNeighborTableClick = () => {
      selectedRouter && openNeighborTable(selectedRouter);
    };
    const onRoutingTableClick = () => {
      selectedRouter && openRoutingTable(selectedRouter);
    };

    const onSendPacketClick = () => enableDestSelectionMode(true);
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
          <li onClick={onRoutingTableClick}>
            <div className={styles.iconContainer}>
              <CiViewTable className={styles.icon} />
            </div>
            Routing Table
          </li>
          <li onClick={openLsDb}>
            <div className={styles.iconContainer}>
              <GoDatabase className={styles.icon} />
            </div>
            Link State Database
          </li>
          <li onClick={onSendPacketClick}>
            <div className={styles.iconContainer}>
              <PiPathFill className={styles.icon} />
            </div>
            Send a Packet
          </li>
        </ul>
      </>
    );
  }, [
    selectedRouter,
    openNeighborTable,
    openLsDb,
    openRoutingTable,
    enableDestSelectionMode,
  ]);

  const connectionOptions = useMemo(() => {
    const areaTree = areaTreeRef.current;
    if (!areaTree || !selectedRouter || !areaTree.root) {
      return [];
    }
    const { ipInterfaces, key: selectedRouterKey } = selectedRouter;
    const selectedRouterIpInterfaces = Array.from(new Set(ipInterfaces.keys()));
    const areas = areaTree.inOrderTraversal(areaTree.root);
    return areas
      .filter(([, area]) => {
        const { ospf } = selectedRouter;
        const { config: selectedRouterConfig } = ospf;
        const { connectedToBackbone, areaId: routerArea } =
          selectedRouterConfig;
        if (routerArea === BACKBONE_AREA_ID) {
          return !area.ospfConfig.connectedToBackbone;
        }
        if (connectedToBackbone) {
          return area.id !== BACKBONE_AREA_ID && area.routerLocations.size > 0;
        }
        return area.routerLocations.size > 0;
      })
      .map(([, area]) => {
        const { routerLocations, id, name } = area;
        return {
          id,
          name,
          connectionOptions: [...routerLocations].filter(([loc, router]) => {
            // If the same interfaces exist on the router, it means that they're connected already.
            const isConnectedToRouter = selectedRouterIpInterfaces.some(
              (interfaceId) =>
                selectedRouter.ipInterfaces
                  .get(interfaceId)!
                  .ipInterface.getOppositeRouter(selectedRouter) === router
            );
            return loc !== selectedRouterKey && !isConnectedToRouter;
          }),
        };
      })
      .filter(({ connectionOptions }) => connectionOptions.length > 0)
      .sort((a, b) => a.id - b.id);
  }, [areaTreeRef, selectedRouter]);

  useEffect(() => {
    if (!selectedRouter) return;
    const { power } = selectedRouter;
    setRouterPower(power);
  }, [selectedRouter]);
  return (
    <div
      ref={pickerRef}
      id={styles.container}
      style={{
        opacity: visible ? 1 : 0,
        zIndex,
        ...position,
      }}
    >
      {!controlsDisabled && Controls}
      {Data}
      {(connectionOptions.length > 0 && (
        <>
          <p className={styles.description}>Connect to...</p>
          {connectionOptions.map(({ name, connectionOptions }) => {
            return (
              <React.Fragment key={`connection_picker_${name}`}>
                <p className={`${styles.area_name} ${styles.description}`}>
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
});

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
