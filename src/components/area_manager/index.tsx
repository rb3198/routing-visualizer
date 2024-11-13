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
import { AreaTree } from "../../entities/area_tree";
import { mapCoordsToGridCell, onCanvasLayout } from "../../utils/ui";
import { Point2D } from "../../types/geometry";
import { getAreaPosition, getPickerPosition } from "./utils";
import { ComponentPicker, PickerOption } from "../picker";
import { RouterMenu } from "../router_menu";
import { CiRouter } from "react-icons/ci";
import { PiRectangleDashed } from "react-icons/pi";
import { IPv4Address } from "../../entities/ip/ipv4_address";
import { OSPFArea } from "../../entities/area";
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
import {
  openLsDbModal,
  setLiveNeighborTable,
  setPropagationDelay,
} from "src/action_creators";
import { PacketLegend } from "../packet_legend";
interface AreaManagerProps {
  gridRect: GridCell[][];
  defaultAreaSize: number;
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
export const AreaManagerComponent: React.FC<AreaManagerProps & ReduxProps> = (
  props
) => {
  const {
    gridRect,
    defaultAreaSize,
    propagationDelay,
    setPropagationDelayInStore,
    setLiveNeighborTable,
    openLsDbModal,
  } = props;
  const iconLayerHoverLocation = useRef<Point2D>();
  const areaLayerHoverLocation = useRef<Point2D>();
  const areaTree = useRef<AreaTree>(new AreaTree());
  const linkInterfaceMap = useRef<Map<string, IPLinkInterface>>(new Map());
  const iconLayerRef = useRef<HTMLCanvasElement>(null);
  const areaLayerRef = useRef<HTMLCanvasElement>(null);
  const componentLayerRef = useRef<HTMLCanvasElement>(null);
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
    "area" | "router" | "none"
  >("none");
  const [connectionOptions, setConnectionOptions] = useState<OSPFArea[]>([]);
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
        .filter((area) => {
          const { ospf } = selectedRouter;
          const { config } = ospf;
          const { connectedToBackbone, areaId } = config;
          if (areaId === BACKBONE_AREA_ID) {
            return !area.ospfConfig.connectedToBackbone;
          }
          if (connectedToBackbone) {
            return (
              area.id !== BACKBONE_AREA_ID && area.routerLocations.size > 0
            );
          }
          return area.routerLocations.size > 0;
        })
        .map((area) => {
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

  /**
   * Clears the previous hover location if current location is different
   */
  const managePreviousHover = useCallback(
    (curRow: number, curCol: number) => {
      const iconLayerContext = iconLayerRef.current?.getContext("2d");
      const compLayerContext = componentLayerRef.current?.getContext("2d");
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
      if (areaLayerHoverLocation.current) {
        const [prevCol, prevRow] = areaLayerHoverLocation.current;
        const [, nearestArea] = areaTree.current.searchClosest([
          prevCol,
          prevRow,
        ]);
        const { routerLocations, getRouterLocationKey } = nearestArea;
        if (!routerLocations.has(getRouterLocationKey(prevRow, prevCol))) {
          compLayerContext &&
            gridRect[prevRow][prevCol].drawEmpty(
              compLayerContext,
              "transparent"
            );
        }
      }
    },
    [gridRect]
  );

  const placeArea: MouseEventHandler = useCallback(() => {
    const iconLayerContext = iconLayerRef.current?.getContext("2d");
    const areaLayerContext = areaLayerRef.current?.getContext("2d");
    if (!iconLayerHoverLocation.current) {
      console.error(
        "Unexpected placeArea call! Active Location must be populated before calling this method"
      );
      return;
    }
    const activeLocation = iconLayerHoverLocation.current;
    const [col, row] = activeLocation;
    if (!areaLayerContext) {
      return;
    }
    const arBounds = getAreaPosition(
      row,
      col,
      defaultAreaSize,
      gridRect[0].length,
      gridRect.length
    );
    if (!arBounds) {
      return;
    }
    const { low, high } = arBounds;
    const [byte1] = rootIp.bytes;
    const nAreas = areaTree.current.inOrderTraversal(
      areaTree.current.root
    ).length;
    const area = new OSPFArea(
      low,
      high,
      nAreas,
      new IPv4Address(byte1, nAreas + 1, 0, 0, 16)
    );
    const { boundingBox } = area;
    const { centroid: areaCentroid } = boundingBox;
    const areaFillColor = Colors.accent + "55";
    area.draw(areaLayerContext, Colors.accent, areaFillColor, gridRect);
    areaTree.current.insert(areaCentroid, area);
    iconLayerContext && gridRect[row][col].drawEmpty(iconLayerContext);
    iconLayerHoverLocation.current = undefined;
    closeComponentPicker();
  }, [iconLayerHoverLocation, defaultAreaSize, gridRect, closeComponentPicker]);

  const placeRouter: MouseEventHandler = useCallback(() => {
    if (
      !areaLayerHoverLocation.current ||
      !areaTree.current.root ||
      !componentLayerRef.current
    ) {
      return;
    }
    const [col, row] = areaLayerHoverLocation.current;
    const [, nearestArea] = areaTree.current.searchClosest([col, row]);
    const { routerLocations, getRouterLocationKey, placeRouter } = nearestArea;
    const routerKey = getRouterLocationKey(row, col);
    if (routerLocations.has(routerKey)) {
      return;
    }
    const context = componentLayerRef.current.getContext("2d");
    if (!context) {
      return;
    }
    let nGlobalRouters = 0;
    areaTree.current
      .inOrderTraversal(areaTree.current.root)
      .forEach(([, area]) =>
        area.routerLocations.forEach(() => nGlobalRouters++)
      );
    const rect = gridRect[row][col];
    const router = placeRouter(row, col, nGlobalRouters, simulationPlaying);
    rect.drawRouter(context, router.id.ip);
    managePreviousHover(row, col);
    closeComponentPicker();
  }, [gridRect, simulationPlaying, closeComponentPicker, managePreviousHover]);

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
        areaTree.current.handleHover(
          compLayerContext,
          column,
          row,
          setComponentOptions,
          setConnectionOptions,
          cell
        )
      ) {
        // Hover is inside an Area, handled by the Area tree.
        areaLayerHoverLocation.current = [column, row];
        return;
      }
      iconLayerHoverLocation.current = [column, row];
      const potentialAreaPosition = getAreaPosition(
        row,
        column,
        defaultAreaSize,
        gridSizeX,
        gridSizeY
      );
      if (potentialAreaPosition) {
        const potentialAsRect = new Rect2D(
          potentialAreaPosition.low,
          potentialAreaPosition.high
        );
        if (areaTree.current.canPlaceOnCell(potentialAsRect)) {
          setComponentOptions("area");
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
      defaultAreaSize,
      gridSizeX,
      gridSizeY,
      managePreviousHover,
    ]
  );

  const onCanvasClick: MouseEventHandler = useCallback(
    (e) => {
      if (!iconLayerRef.current || !areaLayerRef.current || !gridRect.length) {
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
      if (areaTree.current.root) {
        const [, nearestArea] = areaTree.current.searchClosest([column, row]);
        const { routerLocations, getRouterLocationKey } = nearestArea;
        const routerLoc = getRouterLocationKey(row, column);
        if (routerLocations.has(routerLoc)) {
          const selectedRouter = routerLocations.get(routerLoc);
          setSelectedRouter(selectedRouter);
          const { left, bottom, top } = getPickerPosition(
            row,
            column,
            gridRect,
            routerMenuRef.current,
            areaLayerRef.current
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
        areaLayerRef.current
      );
      if (componentOptions === "area" || componentOptions === "router") {
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
  }, [componentOptions, placeArea, placeRouter]);

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
    if (!linkInterfaceMap.current.size || !areaTree.current.root) {
      openNotificationTooltip &&
        openNotificationTooltip(
          "No Connections Created. Please create a network and then start the simulation"
        );
      return false;
    }
    setSimulationPlaying(true);
    areaTree.current
      .inOrderTraversal(areaTree.current.root)
      .forEach(([, ar]) => {
        const { routerLocations } = ar;
        for (const router of routerLocations.values()) {
          const newRouter = router.turnOn();
          if (router === selectedRouter) {
            setSelectedRouter(newRouter);
          }
        }
      });
    return true;
  }, [openNotificationTooltip, selectedRouter]);

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

  const toggleRouterPower = useCallback(async () => {
    if (!selectedRouter) {
      return;
    }
    const { turnedOn, turnOff, turnOn } = selectedRouter;
    if (turnedOn) {
      setSelectedRouter(await turnOff());
    } else {
      setSelectedRouter(turnOn());
    }
  }, [selectedRouter]);

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

  return (
    <>
      <canvas
        id={styles.add_icon_layer}
        className={styles.canvas}
        ref={iconLayerRef}
      />
      <canvas
        id={styles.area_layer}
        className={styles.canvas}
        ref={areaLayerRef}
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
        openLsDbModal={openLsDbModal}
      />
      <AnimationToolbar
        playing={simulationPlaying}
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
    openLsDbModal: bindActionCreators(openLsDbModal, dispatch),
    setPropagationDelayInStore: bindActionCreators(
      setPropagationDelay,
      dispatch
    ),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const AreaManager = connector(AreaManagerComponent);
