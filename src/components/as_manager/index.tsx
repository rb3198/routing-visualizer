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
import { ConnectionPicker } from "../connection_picker";
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

type ConnectionPickerState = PickerState & {
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
export const ASManager: React.FC<ASManagerProps> = (props) => {
  const { gridRect, defaultAsSize } = props;
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
  const connectionPickerRef = useRef<HTMLDivElement>(null);
  const [connectionPicker, setConnectionPicker] =
    useState<ConnectionPickerState>({
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
  const notificationTooltipContext = useContext(NotificationTooltipContext);
  const { open: openNotificationTooltip } = notificationTooltipContext || {};
  const cellSize = (gridRect.length && gridRect[0][0].size) || 0;
  const gridSizeX = (gridRect.length && gridRect[0].length) || 0;
  const gridSizeY = gridRect.length || 0;

  const { position: componentPickerPosition, visible: componentPickerVisible } =
    componentPicker;
  const { visible: connectionPickerVisible } = connectionPicker;

  const openComponentPicker = useCallback(
    (left: number, top?: number, bottom?: number) => {
      setComponentPicker({ visible: true, position: { left, top } });
    },
    []
  );

  const closeComponentPicker = useCallback(() => {
    setComponentPicker({ visible: false, position: { left: -200, top: -200 } });
  }, []);

  const openConnectionPicker = useCallback(
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
      if (!filteredConnectionOptions.length) {
        openNotificationTooltip &&
          openNotificationTooltip("No more connection options available.");
        return;
      }
      setConnectionPicker({
        visible: true,
        position: { top, left, bottom },
        connectionOptions: filteredConnectionOptions,
      });
    },
    [connectionOptions, openNotificationTooltip]
  );

  const closeConnectionPicker = useCallback(() => {
    setConnectionPicker((prevState) => ({
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
      new IPv4Address(byte1, nAs + 1, 0, 0)
    );
    const { boundingBox } = as;
    const { centroid: asCentroid } = boundingBox;
    const asFillColor = Colors.accent + "55";
    as.draw(asLayerContext, Colors.accent, asFillColor, cellSize, gridRect);
    asTree.current.insert(asCentroid, as);
    iconLayerContext && gridRect[row][col].drawEmpty(iconLayerContext);
    iconLayerHoverLocation.current = undefined;
    closeComponentPicker();
  }, [
    iconLayerHoverLocation,
    cellSize,
    defaultAsSize,
    gridRect,
    closeComponentPicker,
  ]);

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
    const router = placeRouter(row, col);
    rect.drawRouter(context, router.id.ip);
    managePreviousHover(row, col);
    closeComponentPicker();
  }, [gridRect, closeComponentPicker, managePreviousHover]);

  const onHover: MouseEventHandler = useCallback(
    (e) => {
      if (
        !iconLayerRef.current ||
        !asLayerRef.current ||
        !asComponentLayerRef.current ||
        !gridRect.length ||
        componentPickerVisible ||
        connectionPickerVisible
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
        cellSize,
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
      cellSize,
      componentPickerVisible,
      connectionPickerVisible,
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
        cellSize,
        gridRect,
        iconLayerRef.current
      );
      if (componentPickerVisible || connectionPickerVisible) {
        const ctx = iconLayerRef.current.getContext("2d");
        closeComponentPicker();
        closeConnectionPicker();
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
            connectionPickerRef.current,
            asLayerRef.current
          );
          openConnectionPicker(left, top, bottom, selectedRouter);
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
      connectionPickerVisible,
      cellSize,
      componentOptions,
      openConnectionPicker,
      closeConnectionPicker,
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
      const baseIp = new IPv4Address(192, 1, linkNo, 0);
      const link = new IPLinkInterface(
        linkId,
        baseIp,
        cellSize,
        [routerA, routerB],
        routerConnectionLayerRef.current?.getContext("2d"),
        elementsLayerRef.current?.getContext("2d")
      );
      linkInterfaceMap.current.set(linkId, link);
      link.draw(routerA, routerB);
      closeConnectionPicker();
    },
    [cellSize, closeConnectionPicker]
  );

  const startSimulation = useCallback(() => {
    if (!linkInterfaceMap.current.size || !asTree.current.root) {
      openNotificationTooltip &&
        openNotificationTooltip(
          "No Connections Created. Please create a network and then start the simulation"
        );
      return false;
    }
    asTree.current.inOrderTraversal(asTree.current.root).forEach(([, as]) => {
      const { routerLocations } = as;
      for (const router of routerLocations.values()) {
        router.turnOn();
      }
    });
    return true;
  }, [openNotificationTooltip]);
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
      <ConnectionPicker
        {...connectionPicker}
        pickerRef={connectionPickerRef}
        addRouterConnection={connectRouters}
        selectedRouter={selectedRouter}
      />
      <AnimationToolbar startSimulation={startSimulation} />
    </>
  );
};
