import React, {
  MouseEventHandler,
  useCallback,
  useContext,
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
import { NotificationTooltipContext } from "../../contexts/notification_tooltip";
import { AnimationToolbar } from "../animation_toolbar";
import { IRootReducer } from "../../reducers";
import { connect, ConnectedProps } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import {
  openLsDbModal,
  openRoutingTable,
  setLiveNeighborTable,
  setPropagationDelay,
} from "src/action_creators";
import { PacketLegend } from "../packet_legend";
import { defaultState, interactiveStateReducer } from "./interaction_manager";
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
    propagationDelay,
    setPropagationDelayInStore,
    setLiveNeighborTable,
    openRoutingTableInStore,
    openLsDbModal,
  } = props;
  const areaTree = useRef<AreaTree>(new AreaTree());
  const linkInterfaceMap = useRef<Map<string, IPLinkInterface>>(new Map());
  const iconLayerRef = useRef<HTMLCanvasElement>(null);
  const areaLayerRef = useRef<HTMLCanvasElement>(null);
  const componentLayerRef = useRef<HTMLCanvasElement>(null);
  const routerConnectionLayerRef = useRef<HTMLCanvasElement>(null);
  const elementsLayerRef = useRef<HTMLCanvasElement>(null);
  const componentPickerRef = useRef<HTMLDivElement>(null);
  const routerMenuRef = useRef<HTMLDivElement>(null);
  const [interactiveState, dispatch] = useReducer(
    interactiveStateReducer,
    defaultState
  );
  const notificationTooltipContext = useContext(NotificationTooltipContext);
  const { open: openNotificationTooltip } = notificationTooltipContext || {};
  const gridSizeX = (gridRect.length && gridRect[0].length) || 0;
  const gridSizeY = gridRect.length || 0;

  const {
    componentPicker,
    routerMenu,
    cursor,
    cell,
    selectedRouter,
    simulationStatus,
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
    ]
  );

  const onCanvasClick: MouseEventHandler = useCallback(
    (e) => {
      if (!iconLayerRef.current || !areaLayerRef.current) {
        return;
      }
      const { clientX, clientY } = e;
      const { row, column } = mapCoordsToGridCell(
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
      });
    },
    [gridRect]
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
    });
    return true;
  }, [openNotificationTooltip]);

  const pauseSimulation = useCallback(() => {
    dispatch({
      type: "pause",
    });
  }, []);

  const setPropagationDelay = (delay: number) => {
    if (!areaTree.current) {
      return;
    }
    areaTree.current
      .inOrderTraversal(areaTree.current.root)
      .forEach(([, area]) => {
        area.setPropagationDelay(delay);
      });
    setPropagationDelayInStore(delay);
  };

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

  const toggleRouterPower = useCallback(async () => {
    if (!selectedRouter) {
      return;
    }
    const { turnedOn, turnOff, turnOn } = selectedRouter;
    if (turnedOn) {
      await turnOff();
    } else {
      turnOn();
    }
    dispatch({
      type: "router_interaction_completed",
    });
  }, [selectedRouter]);

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
    // setSelectingPacketDest(true);
    // setRouterMenu((prevState) => ({ ...prevState, visible: false }));
    // TODO
  }, []);

  //#endregion

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
        onMouseMove={onHover}
        style={{ cursor }}
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
      <RouterMenu
        {...routerMenu}
        areaLayerRef={areaLayerRef}
        gridRect={gridRect}
        cell={cell}
        areaTreeRef={areaTree}
        openNeighborTable={openNeighborTableSnapshot}
        controlsDisabled={simulationStatus !== "playing"}
        pickerRef={routerMenuRef}
        addRouterConnection={connectRouters}
        selectedRouter={selectedRouter}
        toggleRouterPower={toggleRouterPower}
        openLsDbModal={openLsDbModal}
        openRoutingTable={openRoutingTable}
        enableDestSelectionMode={enableDestSelectionMode}
      />
      <AnimationToolbar
        playing={simulationStatus === "playing"}
        propagationDelay={propagationDelay}
        setPropagationDelay={setPropagationDelay}
        startSimulation={startSimulation}
        pauseSimulation={pauseSimulation}
        showTooltip={openNotificationTooltip}
      />
      <PacketLegend />
    </>
  );
};

const mapStateToProps = (state: IRootReducer) => {
  const { eventLog, propagationDelay } = state;
  return {
    eventLog,
    propagationDelay,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setLiveNeighborTable: bindActionCreators(setLiveNeighborTable, dispatch),
    openRoutingTableInStore: bindActionCreators(openRoutingTable, dispatch),
    openLsDbModal: bindActionCreators(openLsDbModal, dispatch),
    setPropagationDelayInStore: bindActionCreators(
      setPropagationDelay,
      dispatch
    ),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const AreaManager = connector(AreaManagerComponent);
