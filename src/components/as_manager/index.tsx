import React, {
  MouseEventHandler,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./styles.module.css";
import { GridCell } from "../../entities/geometry/grid_cell";
import { AutonomousSystemTree } from "../../entities/AutonomousSystemTree";
import { mapCoordsToGridCell, onCanvasLayout } from "../../utils/ui";
import { Point2D } from "../../types/geometry";
import { getASPosition, getPickerPosition } from "./utils";
import { ComponentPicker, PickerOption } from "../picker";
import { RouterMenu } from "../router_menu";
import { CiRouter } from "react-icons/ci";
import { PiRectangleDashed } from "react-icons/pi";
import { IPv4Address } from "../../entities/ip/ipv4_address";
import { AutonomousSystem } from "../../entities/autonomous_system";
import { Colors } from "../../constants/theme";
import { Rect2D } from "../../entities/geometry/Rect2D";
import { Router } from "../../entities/router";
import { IPLinkInterface } from "../../entities/ip/link_interface";
import { NotificationTooltipContext } from "../../contexts/notification_tooltip";
import { AnimationToolbar } from "../animation_toolbar";
import { BACKBONE_AREA_ID } from "../../entities/ospf/constants";
import { IRootReducer } from "../../reducers";
import { connect, ConnectedProps } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { setLiveNeighborTable } from "src/action_creators";
interface ASManagerProps {
  gridRect: GridCell[][];
  defaultAsSize: number;
}

type PickerState = {
  visible: boolean;
  position: {
    left: string | number;
    top?: string | number;
    bottom?: string | number;
  };
};

type RouterMenuState = PickerState & {
  connectionOptions: {
    name: string;
    connectionOptions: [string, Router][];
  }[];
};

const defaultPickerState = {
  visible: false,
  position: {
    top: -200,
    left: -200,
  },
};

const rootIp = new IPv4Address(192, 0, 0, 0, 8);

type ReduxProps = ConnectedProps<typeof connector>;
export const ASManagerComponent: React.FC<ASManagerProps & ReduxProps> = (
  props
) => {
  const { gridRect, defaultAsSize, setLiveNeighborTable } = props;
  const iconLayerHoverLocation = useRef<Point2D>();
  const asLayerHoverLocation = useRef<Point2D>();
  const asTree = useRef<AutonomousSystemTree>(new AutonomousSystemTree());
  const linkInterfaceMap = useRef<Map<string, IPLinkInterface>>(new Map());
  const iconLayerRef = useRef<HTMLCanvasElement>(null);
  const asLayerRef = useRef<HTMLCanvasElement>(null);
  const asComponentLayerRef = useRef<HTMLCanvasElement>(null);
  const routerConnectionLayerRef = useRef<HTMLCanvasElement>(null);
  const elementsLayerRef = useRef<HTMLCanvasElement>(null);
  const componentPickerRef = useRef<HTMLDivElement>(null);
  const routerMenuRef = useRef<HTMLDivElement>(null);
  const [routerMenu, setRouterMenu] = useState<RouterMenuState>({
    ...defaultPickerState,
    connectionOptions: [],
  });
  const [componentPicker, setComponentPicker] =
    useState<PickerState>(defaultPickerState);
  const [componentOptions, setComponentOptions] = useState<
    "as" | "router" | "none"
  >("none");
  const [connectionOptions, setConnectionOptions] = useState<
    AutonomousSystem[]
  >([]);
  const [selectedRouter, setSelectedRouter] = useState<Router>();
  const [simulationPlaying, setSimulationPlaying] = useState(false);
  const notificationTooltipContext = useContext(NotificationTooltipContext);
  const { open: openNotificationTooltip } = notificationTooltipContext || {};
  const gridSizeX = (gridRect.length && gridRect[0].length) || 0;
  const gridSizeY = gridRect.length || 0;

  const { position: componentPickerPosition, visible: componentPickerVisible } =
    componentPicker;
  const { visible: routerMenuVisible } = routerMenu;

  const openComponentPicker = useCallback(
    (left: number, top?: number, bottom?: number) => {
      setComponentPicker({ visible: true, position: { left, top } });
    },
    []
  );

  const closeComponentPicker = useCallback(() => {
    setComponentPicker({ visible: false, position: { left: -200, top: -200 } });
  }, []);

  const openRouterMenu = useCallback(
    (left: number, top?: number, bottom?: number, selectedRouter?: Router) => {
      if (!selectedRouter) {
        return;
      }
      const { ipInterfaces, key: selectedRouterKey } = selectedRouter;
      const selectedRouterIpInterfaces = Array.from(
        new Set(ipInterfaces.keys())
      );
      const filteredConnectionOptions = (connectionOptions || [])
        .filter((as) => {
          const { ospf } = selectedRouter;
          const { config } = ospf;
          const { connectedToBackbone, areaId } = config;
          if (areaId === BACKBONE_AREA_ID) {
            return !as.ospfConfig.connectedToBackbone;
          }
          if (connectedToBackbone) {
            return as.id !== BACKBONE_AREA_ID && as.routerLocations.size > 0;
          }
          return as.routerLocations.size > 0;
        })
        .map((as) => {
          const { routerLocations, id, name } = as;
          return {
            id,
            name,
            connectionOptions: [...routerLocations].filter(([loc, router]) => {
              const { ipInterfaces } = router;
              // If the same interfaces exist on the router, it means that they're connected already.
              const routerIpInterfaces = new Set(ipInterfaces.keys());
              const isConnectedToRouter = selectedRouterIpInterfaces.some(
                (interfaceId) => routerIpInterfaces.has(interfaceId)
              );
              return loc !== selectedRouterKey && !isConnectedToRouter;
            }),
          };
        })
        .filter(({ connectionOptions }) => connectionOptions.length > 0);
      setRouterMenu({
        visible: true,
        position: { top, left, bottom },
        connectionOptions: filteredConnectionOptions,
      });
    },
    [connectionOptions]
  );

  const closeRouterMenu = useCallback(() => {
    setRouterMenu((prevState) => ({
      visible: false,
      position: { left: -200, top: -200 },
      connectionOptions: prevState.connectionOptions,
    }));
  }, []);

  useLayoutEffect(() => {
    [
      iconLayerRef.current,
      asLayerRef.current,
      asComponentLayerRef.current,
      routerConnectionLayerRef.current,
      elementsLayerRef.current,
    ].forEach((canvas) => {
      if (canvas) {
        onCanvasLayout(canvas);
      }
    });
    window.elementLayer = elementsLayerRef.current;
    window.gridComponentLayer = asComponentLayerRef.current;
    window.routerConnectionLayer = routerConnectionLayerRef.current;
  }, []);

  /**
   * Clears the previous hover location if current location is different
   */
  const managePreviousHover = useCallback(
    (curRow: number, curCol: number) => {
      const iconLayerContext = iconLayerRef.current?.getContext("2d");
      const asCompLayerContext = asComponentLayerRef.current?.getContext("2d");
      if (iconLayerHoverLocation.current) {
        const [prevCol, prevRow] = iconLayerHoverLocation.current;
        if (prevCol !== curCol || prevRow !== curRow) {
          iconLayerContext &&
            gridRect[prevRow][prevCol].drawEmpty(
              iconLayerContext,
              "transparent"
            );
        }
      }
      if (asLayerHoverLocation.current) {
        const [prevCol, prevRow] = asLayerHoverLocation.current;
        const [, nearestAs] = asTree.current.searchClosest([prevCol, prevRow]);
        const { routerLocations, getRouterLocationKey } = nearestAs;
        if (!routerLocations.has(getRouterLocationKey(prevRow, prevCol))) {
          asCompLayerContext &&
            gridRect[prevRow][prevCol].drawEmpty(
              asCompLayerContext,
              "transparent"
            );
        }
      }
    },
    [gridRect]
  );

  const placeAS: MouseEventHandler = useCallback(() => {
    const iconLayerContext = iconLayerRef.current?.getContext("2d");
    const asLayerContext = asLayerRef.current?.getContext("2d");
    if (!iconLayerHoverLocation.current) {
      console.error(
        "Unexpected placeAS call! Active Location must be populated before calling this method"
      );
      return;
    }
    const activeLocation = iconLayerHoverLocation.current;
    const [col, row] = activeLocation;
    if (!asLayerContext) {
      return;
    }
    const asBounds = getASPosition(
      row,
      col,
      defaultAsSize,
      gridRect[0].length,
      gridRect.length
    );
    if (!asBounds) {
      return;
    }
    const { low, high } = asBounds;
    const [byte1] = rootIp.bytes;
    const nAs = asTree.current.inOrderTraversal(asTree.current.root).length;
    const as = new AutonomousSystem(
      low,
      high,
      nAs,
      new IPv4Address(byte1, nAs + 1, 0, 0, 16)
    );
    const { boundingBox } = as;
    const { centroid: asCentroid } = boundingBox;
    const asFillColor = Colors.accent + "55";
    as.draw(asLayerContext, Colors.accent, asFillColor, gridRect);
    asTree.current.insert(asCentroid, as);
    iconLayerContext && gridRect[row][col].drawEmpty(iconLayerContext);
    iconLayerHoverLocation.current = undefined;
    closeComponentPicker();
  }, [iconLayerHoverLocation, defaultAsSize, gridRect, closeComponentPicker]);

  const placeRouter: MouseEventHandler = useCallback(() => {
    if (
      !asLayerHoverLocation.current ||
      !asTree.current.root ||
      !asComponentLayerRef.current
    ) {
      return;
    }
    const [col, row] = asLayerHoverLocation.current;
    const [, nearestAs] = asTree.current.searchClosest([col, row]);
    const { routerLocations, getRouterLocationKey, placeRouter } = nearestAs;
    const routerKey = getRouterLocationKey(row, col);
    if (routerLocations.has(routerKey)) {
      return;
    }
    const context = asComponentLayerRef.current.getContext("2d");
    if (!context) {
      return;
    }
    const rect = gridRect[row][col];
    const router = placeRouter(row, col, simulationPlaying);
    rect.drawRouter(context, router.id.ip);
    managePreviousHover(row, col);
    closeComponentPicker();
  }, [gridRect, simulationPlaying, closeComponentPicker, managePreviousHover]);

  const onHover: MouseEventHandler = useCallback(
    (e) => {
      if (
        !iconLayerRef.current ||
        !asLayerRef.current ||
        !asComponentLayerRef.current ||
        !gridRect.length ||
        componentPickerVisible ||
        routerMenuVisible
      ) {
        return;
      }
      const { clientX, clientY } = e;
      const iconLayerContext = iconLayerRef.current.getContext("2d");
      const asCompLayerContext = asComponentLayerRef.current.getContext("2d");
      if (!iconLayerContext || !asCompLayerContext) {
        return;
      }
      const { row, column, cell } = mapCoordsToGridCell(
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
      managePreviousHover(row, column);
      if (
        asTree.current.handleHover(
          asCompLayerContext,
          column,
          row,
          setComponentOptions,
          setConnectionOptions,
          cell
        )
      ) {
        // Hover is inside an AS, handled by the AS tree.
        asLayerHoverLocation.current = [column, row];
        return;
      }
      iconLayerHoverLocation.current = [column, row];
      const potentialAsPosition = getASPosition(
        row,
        column,
        defaultAsSize,
        gridSizeX,
        gridSizeY
      );
      if (potentialAsPosition) {
        const potentialAsRect = new Rect2D(
          potentialAsPosition.low,
          potentialAsPosition.high
        );
        if (asTree.current.canPlaceAsOnCell(potentialAsRect)) {
          setComponentOptions("as");
          cell?.drawAddIcon(iconLayerContext);
        } else {
          setComponentOptions("none");
        }
        iconLayerHoverLocation.current = [column, row];
      }
    },
    [
      gridRect,
      componentPickerVisible,
      routerMenuVisible,
      defaultAsSize,
      gridSizeX,
      gridSizeY,
      managePreviousHover,
    ]
  );

  const onCanvasClick: MouseEventHandler = useCallback(
    (e) => {
      if (!iconLayerRef.current || !asLayerRef.current || !gridRect.length) {
        return;
      }
      const { clientX, clientY } = e;
      const { row, column, cell } = mapCoordsToGridCell(
        clientX,
        clientY,
        gridRect,
        iconLayerRef.current
      );
      if (componentPickerVisible || routerMenuVisible) {
        const ctx = iconLayerRef.current.getContext("2d");
        closeComponentPicker();
        closeRouterMenu();
        managePreviousHover(row, column);
        iconLayerHoverLocation.current = [column, row];
        ctx && cell && cell.drawAddIcon(ctx);
        return;
      }
      if (asTree.current.root) {
        const [, nearestAs] = asTree.current.searchClosest([column, row]);
        const { routerLocations, getRouterLocationKey } = nearestAs;
        const routerLoc = getRouterLocationKey(row, column);
        if (routerLocations.has(routerLoc)) {
          const selectedRouter = routerLocations.get(routerLoc);
          setSelectedRouter(selectedRouter);
          const { left, bottom, top } = getPickerPosition(
            row,
            column,
            gridRect,
            routerMenuRef.current,
            asLayerRef.current
          );
          openRouterMenu(left, top, bottom, selectedRouter);
        }
      }
      const {
        left: compPickerLeft,
        bottom: compPickerBottom,
        top: compPickerTop,
      } = getPickerPosition(
        row,
        column,
        gridRect,
        componentPickerRef.current,
        asLayerRef.current
      );
      if (componentOptions === "as" || componentOptions === "router") {
        openComponentPicker(compPickerLeft, compPickerTop, compPickerBottom);
        return;
      }
    },
    [
      gridRect,
      componentPickerVisible,
      routerMenuVisible,
      componentOptions,
      openRouterMenu,
      closeRouterMenu,
      openComponentPicker,
      closeComponentPicker,
      managePreviousHover,
    ]
  );

  const componentPickerOpts: PickerOption[] = useMemo(() => {
    switch (componentOptions) {
      case "router":
        return [
          {
            label: "Router",
            Icon: CiRouter,
            onClick: placeRouter,
          },
        ];
      case "as":
        return [
          {
            label: "AS Boundary",
            Icon: PiRectangleDashed,
            onClick: placeAS,
          },
        ];
      case "none":
      default:
        return [];
    }
  }, [componentOptions, placeAS, placeRouter]);

  const connectRouters = useCallback(
    (routerA: Router, routerB: Router) => {
      const linkNo = linkInterfaceMap.current.size + 1;
      const linkId = `li_${linkNo}`;
      const link = new IPLinkInterface(linkId, 192, linkNo, [routerA, routerB]);
      linkInterfaceMap.current.set(linkId, link);
      link.draw(routerA, routerB);
      closeRouterMenu();
    },
    [closeRouterMenu]
  );

  const startSimulation = useCallback(() => {
    if (!linkInterfaceMap.current.size || !asTree.current.root) {
      openNotificationTooltip &&
        openNotificationTooltip(
          "No Connections Created. Please create a network and then start the simulation"
        );
      return false;
    }
    setSimulationPlaying(true);
    asTree.current.inOrderTraversal(asTree.current.root).forEach(([, as]) => {
      const { routerLocations } = as;
      for (const router of routerLocations.values()) {
        router.turnOn();
      }
    });
    return true;
  }, [openNotificationTooltip]);

  const pauseSimulation = useCallback(() => {
    setSimulationPlaying(false);
  }, []);

  const openNeighborTableSnapshot = useCallback(
    (router: Router) => {
      setLiveNeighborTable(router.id, router.ospf.neighborTable);
      setRouterMenu((prevState) => ({
        ...prevState,
        visible: false,
      }));
    },
    [setLiveNeighborTable]
  );

  const toggleRouterPower = useCallback(() => {
    if (!selectedRouter) {
      return;
    }
    const { turnedOn, turnOff, turnOn } = selectedRouter;
    if (turnedOn) {
      setSelectedRouter(turnOff());
    } else {
      setSelectedRouter(turnOn());
    }
  }, [selectedRouter]);

  return (
    <>
      <canvas
        id={styles.add_icon_layer}
        className={styles.canvas}
        ref={iconLayerRef}
      />
      <canvas id={styles.as_layer} className={styles.canvas} ref={asLayerRef} />
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
        id={styles.as_component_layer}
        className={styles.canvas}
        ref={asComponentLayerRef}
        onMouseMove={onHover}
        onClick={onCanvasClick}
      />
      <ComponentPicker
        pickerRef={componentPickerRef}
        options={componentPickerOpts}
        position={componentPickerPosition}
        visible={componentPickerVisible}
      />
      <RouterMenu
        {...routerMenu}
        openNeighborTable={openNeighborTableSnapshot}
        controlsDisabled={!simulationPlaying}
        pickerRef={routerMenuRef}
        addRouterConnection={connectRouters}
        selectedRouter={selectedRouter}
        toggleRouterPower={toggleRouterPower}
      />
      <AnimationToolbar
        startSimulation={startSimulation}
        pauseSimulation={pauseSimulation}
        playing={simulationPlaying}
      />
    </>
  );
};

const mapStateToProps = (state: IRootReducer) => {
  const { eventLog } = state;
  return {
    eventLog,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setLiveNeighborTable: bindActionCreators(setLiveNeighborTable, dispatch),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const ASManager = connector(ASManagerComponent);
