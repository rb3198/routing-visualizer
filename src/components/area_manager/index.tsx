import React, {
  MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import styles from "./styles.module.css";
import { GridCell } from "../../entities/geometry/grid_cell";
import { AreaTree } from "../../entities/area_tree";
import { mapCoordsToGridCell, onCanvasLayout } from "../../utils/ui";
import { getAreaPosition } from "./utils";
import { ComponentPicker, PickerOption } from "../picker";
import { RouterMenu } from "../router_menu";
import { CiRouter } from "react-icons/ci";
import { PiRectangleDashed } from "react-icons/pi";
import { Rect2D } from "../../entities/geometry/Rect2D";
import { Router } from "../../entities/router";
import { IPLinkInterface } from "../../entities/ip/link_interface";
import { Toolbar } from "../toolbar";
import { IRootReducer } from "../../reducers";
import { connect, ConnectedProps } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import {
  clearEventLog,
  openLsDbModal,
  openNotificationTooltip,
  openRoutingTable,
  setLiveNeighborTable,
} from "src/action_creators";
import { PacketLegend } from "../packet_legend";
import { defaultState, interactiveStateReducer } from "./interaction_manager";
import { LsDb } from "src/entities/router/ospf_interface/ls_db";
import { DestinationSelector } from "../destination_selector";
interface AreaManagerProps {
  gridRect: GridCell[][];
  defaultAreaSize: number;
}

type ReduxProps = ConnectedProps<typeof connector>;

export const AreaManagerComponent: React.FC<AreaManagerProps & ReduxProps> = (
  props
) => {
  const {
    gridRect,
    defaultAreaSize,
    cellSize,
    setLiveNeighborTable,
    openRoutingTableInStore,
    openLsDbModal: openLsDbModalInStore,
    openNotificationTooltip,
    clearEventLog,
  } = props;
  const areaTree = useRef<AreaTree>(new AreaTree());
  const linkInterfaceMap = useRef<Map<string, IPLinkInterface>>(new Map());
  const iconLayerRef = useRef<HTMLCanvasElement>(null);
  const areaLayerRef = useRef<HTMLCanvasElement>(null);
  const componentLayerRef = useRef<HTMLCanvasElement>(null);
  const overlayLayerRef = useRef<HTMLCanvasElement>(null);
  const interactionLayerRef = useRef<HTMLCanvasElement>(null);
  const routerConnectionLayerRef = useRef<HTMLCanvasElement>(null);
  const elementsLayerRef = useRef<HTMLCanvasElement>(null);
  const componentPickerRef = useRef<HTMLDivElement>(null);
  const routerMenuRef = useRef<HTMLDivElement>(null);
  const [interactiveState, dispatch] = useReducer(
    interactiveStateReducer,
    defaultState
  );
  const gridSizeX = (gridRect.length && gridRect[0].length) || 0;
  const gridSizeY = gridRect.length || 0;

  const {
    componentPicker,
    routerMenu,
    cursor,
    cell,
    selectedRouter,
    simulationStatus,
    state,
  } = interactiveState;

  const { visible: componentPickerVisible, option: componentPickerType } =
    componentPicker;
  const { visible: routerMenuVisible } = routerMenu;

  useEffect(() => {
    dispatch({
      type: "set_grid",
      gridRect,
    });
  }, [gridRect]);
  useLayoutEffect(() => {
    [
      iconLayerRef.current,
      areaLayerRef.current,
      componentLayerRef.current,
      routerConnectionLayerRef.current,
      elementsLayerRef.current,
      overlayLayerRef.current,
      interactionLayerRef.current,
    ].forEach((canvas) => {
      if (canvas) {
        onCanvasLayout(canvas);
      }
    });
    window.elementLayer = elementsLayerRef.current;
    window.gridComponentLayer = componentLayerRef.current;
    window.routerConnectionLayer = routerConnectionLayerRef.current;
  }, []);

  const placeArea: MouseEventHandler = useCallback(() => {
    if (!areaLayerRef.current || !iconLayerRef.current || !cell) {
      return;
    }
    dispatch({
      type: "component_picked",
      cell,
      areaTree: areaTree.current,
      areaLayer: areaLayerRef.current,
      areaSize: defaultAreaSize,
      iconLayer: iconLayerRef.current,
    });
  }, [cell, defaultAreaSize]);

  const placeRouter: MouseEventHandler = useCallback(() => {
    if (!areaTree.current.root || !componentLayerRef.current || !cell) {
      return;
    }
    dispatch({
      type: "component_picked",
      areaLayer: areaLayerRef.current,
      areaSize: defaultAreaSize,
      areaTree: areaTree.current,
      iconLayer: iconLayerRef.current,
      compLayer: componentLayerRef.current,
      cell,
    });
  }, [cell, defaultAreaSize]);

  const onHover: MouseEventHandler = useCallback(
    (e) => {
      if (
        !iconLayerRef.current ||
        !areaLayerRef.current ||
        !componentLayerRef.current ||
        !gridRect.length ||
        componentPickerVisible ||
        routerMenuVisible
      ) {
        return;
      }
      const { clientX, clientY } = e;
      const iconLayerContext = iconLayerRef.current.getContext("2d");
      const compLayerContext = componentLayerRef.current.getContext("2d");
      if (!iconLayerContext || !compLayerContext) {
        return;
      }
      const { row, column } = mapCoordsToGridCell(
        cellSize,
        clientX,
        clientY,
        gridRect,
        iconLayerRef.current
      );
      if (
        row < 0 ||
        column < 0 ||
        row >= gridRect.length ||
        column >= gridRect[row].length
      ) {
        return;
      }
      const { inArea, canPlaceRouter, cursor } = areaTree.current.handleHover(
        column,
        row
      );
      if (inArea) {
        // Hover is inside an Area
        dispatch({
          type: "hover",
          cursor,
          draw: canPlaceRouter,
          cell: [column, row],
          iconLayer: iconLayerRef.current,
        });
        return;
      }
      const potentialAreaPosition = getAreaPosition(
        row,
        column,
        defaultAreaSize,
        gridSizeX,
        gridSizeY
      );
      const potentialAreaRect = new Rect2D(
        potentialAreaPosition.low,
        potentialAreaPosition.high
      );
      if (!areaTree.current.canPlaceOnCell(potentialAreaRect)) {
        dispatch({
          type: "hover",
          cursor: "initial",
          cell: [column, row],
          iconLayer: iconLayerRef.current,
        });
        return;
      }
      dispatch({
        type: "hover",
        cursor: "pointer",
        cell: [column, row],
        iconLayer: iconLayerRef.current,
        draw: true,
      });
    },
    [
      gridRect,
      componentPickerVisible,
      routerMenuVisible,
      defaultAreaSize,
      gridSizeX,
      gridSizeY,
      cellSize,
    ]
  );

  const onCanvasClick: MouseEventHandler = useCallback(
    (e) => {
      if (
        !iconLayerRef.current ||
        !areaLayerRef.current ||
        !overlayLayerRef.current
      ) {
        return;
      }
      const { clientX, clientY } = e;
      const { row, column } = mapCoordsToGridCell(
        cellSize,
        clientX,
        clientY,
        gridRect,
        iconLayerRef.current
      );
      dispatch({
        type: "click",
        areaLayer: areaLayerRef.current,
        cell: [column, row],
        routerMenuComponent: routerMenuRef.current,
        componentPickerComponent: componentPickerRef.current,
        iconLayer: iconLayerRef.current,
        areaTree: areaTree.current,
        overlayLayer: overlayLayerRef.current,
      });
    },
    [gridRect, cellSize]
  );

  const componentPickerOpts: PickerOption[] = useMemo(() => {
    switch (componentPickerType) {
      case "router":
        return [
          {
            label: "Router",
            Icon: CiRouter,
            onClick: placeRouter,
          },
        ];
      case "area":
        return [
          {
            label: "Area Boundary",
            Icon: PiRectangleDashed,
            onClick: placeArea,
          },
        ];
      case "none":
      default:
        return [];
    }
  }, [componentPickerType, placeArea, placeRouter]);

  const startSimulation = useCallback(() => {
    if (!linkInterfaceMap.current.size || !areaTree.current.root) {
      openNotificationTooltip &&
        openNotificationTooltip(
          "No Connections Created. Please create a network and then start the simulation"
        );
      return false;
    }
    dispatch({
      type: "play",
      areaTree: areaTree.current,
      compLayer: componentLayerRef.current,
    });
    return true;
  }, [openNotificationTooltip]);

  const pauseSimulation = useCallback(() => {
    dispatch({
      type: "pause",
    });
  }, []);

  const stopSimulation = useCallback(async () => {
    const context = componentLayerRef.current?.getContext("2d");
    openNotificationTooltip(`Stopping the simulation... Please note that it may 
      take a long time to stop if Graceful Shutdown is set to ON.`);
    for (let [, area] of areaTree.current.inOrderTraversal(
      areaTree.current.root
    )) {
      const { routerLocations } = area;
      for (let [, router] of routerLocations) {
        await router.turnOff(gridRect, context);
      }
    }
    openNotificationTooltip(
      "Stopped the simulation - All routers shutdown, all processes stopped",
      4000
    );
    dispatch({
      type: "stop",
    });
    clearEventLog();
  }, [gridRect, openNotificationTooltip, clearEventLog]);

  //#region Router Menu Methods
  const connectRouters = useCallback((routerA: Router, routerB: Router) => {
    const linkNo = linkInterfaceMap.current.size + 1;
    const linkId = `li_${linkNo}`;
    const link = new IPLinkInterface(linkId, 192, linkNo, [routerA, routerB]);
    linkInterfaceMap.current.set(linkId, link);
    link.draw(routerA, routerB);
    dispatch({ type: "router_interaction_completed" });
  }, []);

  const openNeighborTableSnapshot = useCallback(
    (router: Router) => {
      setLiveNeighborTable(router.id, router.ospf.neighborTable);
      dispatch({ type: "router_interaction_completed" });
    },
    [setLiveNeighborTable]
  );

  const onRouterInteractionComplete = useCallback(async () => {
    dispatch({
      type: "router_interaction_completed",
    });
  }, []);

  const openRoutingTable = (router: Router) => {
    const { id: routerId, ospf } = router;
    const { routingTableManager } = ospf;
    openRoutingTableInStore(
      routerId,
      routingTableManager.getFullTables().table
    );
    dispatch({
      type: "router_interaction_completed",
    });
  };

  const enableDestSelectionMode = useCallback(() => {
    if (!overlayLayerRef.current) {
      return;
    }
    dispatch({
      type: "send_packet",
      overlayLayer: overlayLayerRef.current,
      areaTree: areaTree.current,
    });
  }, []);

  const openLsDbModal = useCallback(
    (lsDb: LsDb) => {
      openLsDbModalInStore(lsDb);
      dispatch({
        type: "router_interaction_completed",
      });
    },
    [openLsDbModalInStore]
  );

  //#endregion

  const onConnectionSelect = useCallback((conn: string) => {
    overlayLayerRef.current &&
      dispatch({
        type: "packet_dest_selected",
        destinationIp: conn,
        overlayLayer: overlayLayerRef.current,
      });
  }, []);

  const renderConnectionOptions = useCallback(
    (destinationRouter?: Router, connectionOptions?: string[]) => {
      const connectionsExist =
        connectionOptions && connectionOptions.length > 0;
      const headerText = connectionsExist
        ? "Select the Destination Interface"
        : "Select the Destination Router";
      const renderConnectionPicker = connectionsExist || destinationRouter;
      return (
        <>
          <div id={styles.packet_dest_overlay}>
            <h3>{headerText}</h3>
            {(selectedRouter && (
              <p
                style={{ fontWeight: "bold" }}
              >{`Source Router: ${selectedRouter.id}`}</p>
            )) || <></>}
            {(destinationRouter && (
              <p
                style={{ fontWeight: "bold" }}
              >{`Destination Router: ${destinationRouter.id}`}</p>
            )) || <></>}
            <p>Click Anywhere else to cancel this action.</p>
          </div>
          {renderConnectionPicker && (
            <DestinationSelector
              connectionOptions={connectionOptions ?? []}
              onSelect={onConnectionSelect}
            />
          )}
        </>
      );
    },
    [onConnectionSelect, selectedRouter]
  );
  return (
    <>
      <canvas
        id={styles.area_layer}
        className={styles.canvas}
        ref={areaLayerRef}
      />
      <canvas
        id={styles.add_icon_layer}
        className={styles.canvas}
        ref={iconLayerRef}
      />
      <canvas
        id={styles.router_connection_layer}
        className={styles.canvas}
        ref={routerConnectionLayerRef}
      />
      <canvas
        id={styles.elements_layer}
        className={styles.canvas}
        ref={elementsLayerRef}
      />
      <canvas
        id={styles.component_layer}
        className={styles.canvas}
        ref={componentLayerRef}
      />
      <canvas
        id={styles.overlay_layer}
        className={styles.canvas}
        ref={overlayLayerRef}
      />
      <canvas
        id={styles.interaction_layer}
        className={styles.canvas}
        ref={interactionLayerRef}
        style={{ cursor }}
        onMouseMove={onHover}
        onClick={onCanvasClick}
      />
      {(cell && (
        <ComponentPicker
          pickerRef={componentPickerRef}
          options={componentPickerOpts}
          cell={cell}
          areaLayerRef={areaLayerRef}
          gridRect={gridRect}
          visible={componentPickerVisible}
        />
      )) || <></>}
      {state === "selecting_packet_dest" &&
        renderConnectionOptions(
          interactiveState.destinationRouter,
          interactiveState.connectionOptions
        )}
      <RouterMenu
        {...routerMenu}
        areaLayerRef={areaLayerRef}
        componentLayerRef={componentLayerRef}
        gridRect={gridRect}
        cell={cell}
        areaTreeRef={areaTree}
        openNeighborTable={openNeighborTableSnapshot}
        controlsDisabled={simulationStatus !== "playing"}
        pickerRef={routerMenuRef}
        addRouterConnection={connectRouters}
        selectedRouter={selectedRouter}
        onRouterInteractionComplete={onRouterInteractionComplete}
        openLsDbModal={openLsDbModal}
        openRoutingTable={openRoutingTable}
        enableDestSelectionMode={enableDestSelectionMode}
      />
      <Toolbar
        playing={simulationStatus === "playing"}
        startSimulation={startSimulation}
        pauseSimulation={pauseSimulation}
        stopSimulation={stopSimulation}
        showTooltip={openNotificationTooltip}
        areaTree={areaTree}
      />
      <PacketLegend />
    </>
  );
};

const mapStateToProps = (state: IRootReducer) => {
  const { cellSize } = state;
  return { cellSize };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setLiveNeighborTable: bindActionCreators(setLiveNeighborTable, dispatch),
    openRoutingTableInStore: bindActionCreators(openRoutingTable, dispatch),
    openLsDbModal: bindActionCreators(openLsDbModal, dispatch),
    openNotificationTooltip: bindActionCreators(
      openNotificationTooltip,
      dispatch
    ),
    clearEventLog: bindActionCreators(clearEventLog, dispatch),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const AreaManager = connector(AreaManagerComponent);
