import { Reducer } from "react";
import {
  InteractiveState,
  InteractiveAction,
  DefaultComponentPickerState,
  DefaultRouterMenuState,
} from "./types";
import { GridCell } from "src/entities/geometry/grid_cell";
import { Point2D } from "src/types/geometry";
import { getAreaPosition } from "../utils";
import { AreaTree } from "src/entities/area_tree";
import { OSPFArea } from "src/entities/area";
import { getAreaIp } from "src/utils/common";
import { Colors } from "src/constants/theme";
import { Router } from "src/entities/router";
import { BACKBONE_AREA_ID } from "src/entities/ospf/constants";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { IPProtocolNumber } from "src/entities/ip/enum/ip_protocol_number";
import { clearCanvas, getCellSize } from "src/utils/drawing";
import { IPLinkInterface } from "src/entities/ip/link_interface";
import { ConfigFile } from "src/entities/config";
import { RouterPowerState } from "src/entities/router/enum/RouterPowerState";

export const defaultPickerState: DefaultComponentPickerState = {
  visible: false,
  option: "none",
};

export const defaultRouterMenuState: DefaultRouterMenuState = {
  visible: false,
};

export const defaultState: InteractiveState = {
  simulationStatus: "stopped",
  state: "hovering",
  componentPicker: defaultPickerState,
  routerMenu: defaultRouterMenuState,
  selectedRouter: undefined,
  cell: [-1, -1],
  gridRect: [],
  cursor: "initial",
  warnConfigLoad: false,
};

export const drawAddIcon = (
  gridRect: GridCell[][],
  coords: Point2D,
  canvas: HTMLCanvasElement
) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  const [col, row] = coords;
  const cell = gridRect[row] && gridRect[row][col];
  cell?.drawAddIcon(context);
};

/**
 * Clears the previous hover location if current location is different
 */
export const managePreviousHover = (
  prevCell: Point2D | undefined,
  curCell: Point2D,
  gridRect: GridCell[][],
  iconLayer: HTMLCanvasElement
) => {
  const iconLayerContext = iconLayer?.getContext("2d");
  const [curCol, curRow] = curCell;
  if (prevCell) {
    const [prevCol, prevRow] = prevCell;
    if (prevCol !== curCol || prevRow !== curRow) {
      iconLayerContext &&
        gridRect[prevRow] &&
        gridRect[prevRow][prevCol]?.drawEmpty(iconLayerContext, "transparent");
    }
  }
};

const placeArea = (
  cell: Point2D,
  areaSize: number,
  gridRect: GridCell[][],
  areaTree: AreaTree,
  areaLayer: HTMLCanvasElement,
  compLayer: HTMLCanvasElement,
  iconLayer: HTMLCanvasElement
) => {
  const [col, row] = cell;
  const areaCtx = areaLayer.getContext("2d");
  const iconCtx = iconLayer.getContext("2d");
  const compCtx = compLayer.getContext("2d");
  if (!areaCtx || !compCtx) {
    return;
  }
  const arBounds = getAreaPosition(row, col, areaSize, gridRect);
  if (!arBounds) {
    return;
  }
  const { low, high } = arBounds;
  const nAreas = areaTree.inOrderTraversal(areaTree.root).length;
  const area = new OSPFArea(low, high, nAreas, getAreaIp(nAreas));
  const { boundingBox } = area;
  const { centroid: areaCentroid } = boundingBox;
  try {
    areaTree.search(areaCentroid);
    return;
  } catch (ex) {
    const areaFillColor = Colors.accent + "55";
    area.draw(areaCtx, compCtx, Colors.accent, areaFillColor);
    areaTree.insert(areaCentroid, area);
    iconCtx && gridRect[row][col].drawEmpty(iconCtx);
  }
};

const placeRouter = (
  cell: Point2D,
  gridRect: GridCell[][],
  areaTree: AreaTree,
  componentLayer: HTMLCanvasElement,
  simulationPlaying: boolean
) => {
  const [col, row] = cell;
  const rect = gridRect[row][col];
  const { x, y } = rect;
  const point = [x, y] as Point2D;
  const [, nearestArea] = areaTree.searchClosest(point);
  const { routerLocations, placeRouter } = nearestArea;
  const context = componentLayer.getContext("2d");
  if (!context) {
    return;
  }
  const place = () => {
    let nGlobalRouters = 0;
    areaTree
      .inOrderTraversal(areaTree.root)
      .forEach(
        ([, area]) =>
          (nGlobalRouters += area.routerLocations.inOrderTraversal(
            area.routerLocations.root
          ).length)
      );
    const router = placeRouter(point, nGlobalRouters, simulationPlaying);
    router.draw(context);
  };
  try {
    const [, nearestRouter] = routerLocations.searchClosest(point);
    if (nearestRouter.boundingBox.isWithinBounds(point)) {
      return;
    }
    place();
  } catch (error) {
    place();
  }
};

const highlightDestinationRouters = (
  areaTree: AreaTree,
  overlayLayer: HTMLCanvasElement,
  gridRect: GridCell[][],
  sourceRouter: Router
) => {
  const allRouterLocations = new Set<string>();
  const context = overlayLayer.getContext("2d");
  areaTree.inOrderTraversal(areaTree.root).forEach(([, area]) => {
    const { routerLocations } = area;
    routerLocations
      .inOrderTraversal(routerLocations.root)
      .forEach(([, router]) => {
        const { location } = router;
        const [x, y] = location;
        if (x === sourceRouter.location[0] && y === sourceRouter.location[1]) {
          return;
        }
        allRouterLocations.add(`${x}_${y}`);
      });
  });
  for (let row = 0; row < gridRect.length; row++) {
    for (let col = 0; col < gridRect[0].length; col++) {
      const { x, y } = gridRect[row][col];
      if (allRouterLocations.has(`${x}_${y}`)) {
        continue;
      }
      context && gridRect[row][col].drawOverlay(context);
    }
  }
};

const clearOverlay = (overlayLayer: HTMLCanvasElement) => {
  const context = overlayLayer.getContext("2d");
  const { width, height } = overlayLayer.getBoundingClientRect();
  context && context.clearRect(0, 0, width, height);
};

const getConnectionOptions = (selectedRouter: Router, areaTree: AreaTree) => {
  const { ipInterfaces, id: selectedRouterId } = selectedRouter;
  const selectedRouterIpInterfaces = Array.from(new Set(ipInterfaces.keys()));
  const connectionOptions = areaTree
    .inOrderTraversal(areaTree.root)
    .map(([, area]) => area);
  return (connectionOptions || [])
    .filter((area) => {
      const { ospf } = selectedRouter;
      const { config } = ospf;
      const { connectedToBackbone, areaId } = config;
      if (areaId === BACKBONE_AREA_ID) {
        return !area.ospfConfig.connectedToBackbone;
      }
      if (connectedToBackbone) {
        return area.id !== BACKBONE_AREA_ID && !!area.routerLocations.root;
      }
      return !!area.routerLocations.root;
    })
    .map((area) => {
      const { routerLocations, id, name } = area;
      return {
        id,
        name,
        connectionOptions: [
          ...routerLocations.inOrderTraversal(routerLocations.root),
        ].filter(([, router]) => {
          // If the same interfaces exist on the router, it means that they're connected already.
          const isConnectedToRouter = selectedRouterIpInterfaces.some(
            (interfaceId) =>
              selectedRouter.ipInterfaces
                .get(interfaceId)!
                .ipInterface.getOppositeRouter(selectedRouter) === router
          );
          return !router.id.equals(selectedRouterId) && !isConnectedToRouter;
        }),
      };
    })
    .filter(({ connectionOptions }) => connectionOptions.length > 0);
};

const drawAreasWithRouters = (
  areaTree: AreaTree,
  areaLayer: HTMLCanvasElement,
  compLayer: HTMLCanvasElement
) => {
  const areaCtx = areaLayer.getContext("2d");
  const compCtx = compLayer.getContext("2d");
  if (!areaCtx || !compCtx) {
    return;
  }
  areaTree.inOrderTraversal(areaTree.root).forEach(([, area]) => {
    const areaFillColor = Colors.accent + "55";
    area.draw(areaCtx, compCtx, Colors.accent, areaFillColor);
  });
};

const redrawNetwork = (
  areaTree: AreaTree,
  linkInterfaceMap: Map<string, IPLinkInterface>
) => {
  const {
    routerConnectionLayer,
    gridComponentLayer: compLayer,
    areaLayer,
    iconLayer,
    elementLayer,
  } = window;
  [
    areaLayer,
    compLayer,
    iconLayer,
    routerConnectionLayer,
    elementLayer,
  ].forEach((canvas) => clearCanvas(canvas));
  areaLayer &&
    compLayer &&
    drawAreasWithRouters(areaTree, areaLayer, compLayer);
  if (routerConnectionLayer) {
    const { width, height } = routerConnectionLayer.getBoundingClientRect();
    const ctx = routerConnectionLayer.getContext("2d");
    ctx?.clearRect(0, 0, width, height);
    linkInterfaceMap.forEach((link) => {
      const { routers: routerMap } = link;
      const routers = Array.from(routerMap.values());
      link.draw(routers[0], routers[1]);
    });
  }
};

const getStateFromConfig = (
  areaTree: AreaTree,
  linkInterfaceMap: Map<string, IPLinkInterface>,
  config: ConfigFile
) => {
  const getLocKey = (loc: Point2D) => `${loc[0]}_${loc[1]}`;
  const { areas, links } = config;
  const allRouters: Record<string, Router> = {};
  for (let areaConstructor of areas) {
    const { low, high, id, ipBytes, routers } = areaConstructor;
    const area = new OSPFArea(low, high, id, new IPv4Address(...ipBytes));
    const { boundingBox } = area;
    const { centroid } = boundingBox;
    areaTree.insert(centroid, area);
    for (let routerConstructor of routers) {
      const { gracefulShutdown, ipBytes, low, ospfConfig } = routerConstructor;
      const router = new Router(
        low,
        new IPv4Address(...ipBytes),
        ospfConfig,
        RouterPowerState.Shutdown,
        gracefulShutdown
      );
      allRouters[getLocKey(low)] = router;
      area.addRouterToTree(router);
    }
  }
  for (let linkConstructor of links) {
    const { id, ipBytes, routers: routerLocs } = linkConstructor;
    const routers = routerLocs.map((low) => allRouters[getLocKey(low)]) as [
      Router,
      Router
    ];
    if (routers.length !== 2 || routers.some((r) => !r)) {
      continue;
    }
    const link = new IPLinkInterface(id, ipBytes[0], ipBytes[2], routers);
    linkInterfaceMap.set(id, link);
  }
};

export const interactiveStateReducer: Reducer<
  InteractiveState,
  InteractiveAction
> = (state, action) => {
  const { type } = action;
  const {
    simulationStatus: prevStatus,
    state: prevInteractionState,
    selectedRouter: prevSelectedRouter,
    componentPicker: prevComponentPicker,
    cell: prevCell,
    gridRect,
    warnConfigLoad: prevWarnConfigLoad,
  } = state;
  if (type === "set_grid") {
    const { gridRect: newGridRect } = action;
    return {
      ...state,
      gridRect: newGridRect,
    };
  }
  if (type === "component_picked") {
    const { cell, areaSize, areaTree, areaLayer, iconLayer, compLayer } =
      action;
    if (prevInteractionState !== "picking_component") {
      return state;
    }
    const { option: componentType } = prevComponentPicker;

    componentType === "area" &&
      areaLayer &&
      compLayer &&
      iconLayer &&
      placeArea(
        cell,
        areaSize,
        gridRect,
        areaTree,
        areaLayer,
        compLayer,
        iconLayer
      );
    componentType === "router" &&
      compLayer &&
      placeRouter(
        cell,
        gridRect,
        areaTree,
        compLayer,
        prevStatus === "playing"
      );
    return {
      ...state,
      state: "hovering",
      warnConfigLoad: true,
      selectedRouter: undefined,
      cell: cell ?? [-1, -1],
      componentPicker: defaultPickerState,
      routerMenu: defaultRouterMenuState,
    };
  }
  if (type === "router_interaction_completed") {
    const { cell, warnConfigLoad } = action;
    return {
      ...state,
      warnConfigLoad: warnConfigLoad ?? prevWarnConfigLoad,
      state: "hovering",
      selectedRouter: undefined,
      cell: cell ?? [-1, -1],
      componentPicker: defaultPickerState,
      routerMenu: defaultRouterMenuState,
    };
  }
  if (type === "send_packet") {
    if (
      prevInteractionState !== "router_interaction" ||
      prevStatus !== "playing"
    ) {
      // TODO: Show tooltip saying Simulation should be in a playing state.
      return {
        ...state,
        state: "hovering",
        selectedRouter: undefined,
        componentPicker: defaultPickerState,
        routerMenu: defaultRouterMenuState,
      };
    }
    const { overlayLayer, areaTree } = action;
    highlightDestinationRouters(
      areaTree,
      overlayLayer,
      gridRect,
      prevSelectedRouter
    );
    return {
      ...state,
      state: "selecting_packet_dest",
      simulationStatus: "playing",
      routerMenu: defaultRouterMenuState,
    };
  }
  if (type === "play") {
    const { areaTree, compLayer } = action;
    const context = compLayer?.getContext("2d");
    setTimeout(() =>
      areaTree.inOrderTraversal(areaTree.root).forEach(([, ar]) => {
        const { routerLocations } = ar;
        for (const [, router] of routerLocations.inOrderTraversal(
          routerLocations.root
        )) {
          router.turnOn(context);
        }
      })
    );
    const newState: InteractiveState = {
      ...state,
      simulationStatus: "playing",
      state: "hovering",
      selectedRouter: undefined,
      routerMenu: defaultRouterMenuState,
      componentPicker: defaultPickerState,
    };
    return newState;
  }
  // TODO: Type = Pause.
  if (type === "stop") {
    return {
      ...state,
      simulationStatus: "stopped",
      state: "hovering",
      selectedRouter: undefined,
      routerMenu: defaultRouterMenuState,
      componentPicker: defaultPickerState,
    };
  }
  if (type === "hover") {
    const { cell, iconLayer, draw, cursor } = action;
    if (prevInteractionState !== "hovering") {
      return state;
    }
    window.requestAnimationFrame(() => {
      if (prevCell) {
        // clear the cell
        managePreviousHover(prevCell, cell, gridRect, iconLayer);
      }
      draw && drawAddIcon(gridRect, cell, iconLayer);
    });
    return {
      ...state,
      cell,
      cursor,
    };
  }
  if (type === "packet_dest_selected") {
    if (prevInteractionState !== "selecting_packet_dest") {
      return state;
    }
    const { destinationIp, overlayLayer } = action;
    const context = overlayLayer.getContext("2d");
    const { width, height } = overlayLayer.getBoundingClientRect();
    context?.clearRect(0, 0, width, height);
    prevSelectedRouter.originateIpPacket(
      IPv4Address.fromString(destinationIp),
      IPProtocolNumber.udp,
      // @ts-ignore TODO: Convert to ICMP packet
      "Hello"
    );
    const newState: InteractiveState = {
      warnConfigLoad: prevWarnConfigLoad,
      selectedRouter: undefined,
      state: "hovering",
      cell: [-1, -1],
      componentPicker: defaultPickerState,
      routerMenu: defaultRouterMenuState,
      cursor: "initial",
      gridRect,
      simulationStatus: prevStatus,
    };
    return newState;
  }
  if (type === "click") {
    const { cell, iconLayer, areaTree, overlayLayer } = action;
    const [column, row] = cell;
    const rect = gridRect[row][column];
    const cellSize = getCellSize();
    const point = [rect.x + cellSize / 2, rect.y + cellSize / 2];
    switch (prevInteractionState) {
      case "hovering":
        if (state.cursor !== "pointer") {
          return state;
        }
        if (areaTree.root) {
          const [, nearestArea] = areaTree.searchClosest(point);
          const { routerLocations, boundingBox } = nearestArea;
          if (boundingBox.isWithinBounds(point)) {
            try {
              const [, nearestRouter] = routerLocations.searchClosest(point);
              if (nearestRouter.boundingBox.isWithinBounds(point)) {
                // If sending packet dispatch send packet (write in diff case) else open router menu
                const connectionOptions = getConnectionOptions(
                  nearestRouter,
                  areaTree
                );
                return {
                  ...state,
                  state: "router_interaction",
                  cell,
                  componentPicker: defaultPickerState,
                  selectedRouter: nearestRouter,
                  routerMenu: { visible: true, connectionOptions },
                  cursor: "pointer",
                };
              }
            } catch (error) {}
            return {
              ...state,
              state: "picking_component",
              routerMenu: defaultRouterMenuState,
              selectedRouter: undefined,
              cell,
              componentPicker: {
                option: "router",
                visible: true,
              },
            };
          }
        }
        return {
          ...state,
          state: "picking_component",
          selectedRouter: undefined,
          routerMenu: defaultRouterMenuState,
          cell,
          componentPicker: {
            option: "area",
            visible: true,
          },
        };
      case "picking_component":
      case "router_interaction":
        if (prevCell) {
          // clear the cell
          managePreviousHover(prevCell, cell, gridRect, iconLayer);
        }
        return {
          ...state,
          state: "hovering",
          cell,
          componentPicker: defaultPickerState,
          routerMenu: defaultPickerState,
          selectedRouter: undefined,
        };
      case "selecting_packet_dest":
        const hoveringState: InteractiveState = {
          state: "hovering",
          selectedRouter: undefined,
          routerMenu: defaultRouterMenuState,
          componentPicker: defaultPickerState,
          cell,
          cursor: "initial",
          gridRect,
          warnConfigLoad: prevWarnConfigLoad,
          simulationStatus: prevStatus,
        };
        if (!areaTree.root) {
          clearOverlay(overlayLayer);
          return hoveringState;
        }
        const [, nearestArea] = areaTree.searchClosest(point);
        const { routerLocations, boundingBox } = nearestArea;
        if (!boundingBox.isWithinBounds(point)) {
          clearOverlay(overlayLayer);
          return hoveringState;
        }
        const clear = () => {
          clearOverlay(overlayLayer);
          return hoveringState;
        };
        try {
          const [, router] = routerLocations.search(point);
          if (
            router.location.join("_") === prevSelectedRouter.location.join("_")
          ) {
            return clear();
          }
          const connectionOptions = Array.from(router.ipInterfaces.keys());
          return {
            ...state,
            connectionOptions,
            destinationRouter: router,
          };
        } catch (error) {
          return clear();
        }
      default:
        return state;
    }
  }
  if (type === "zoomed" || type === "panned") {
    const { areaTree, linkInterfaceMap } = action;
    redrawNetwork(areaTree, linkInterfaceMap);
    return type === "zoomed"
      ? state
      : {
          ...state,
          cursor: "grabbing",
        };
  }
  if (type === "config_changed") {
    return {
      ...state,
      warnConfigLoad: true,
    };
  }
  if (type === "config_saved") {
    return {
      ...state,
      warnConfigLoad: false,
    };
  }
  if (type === "load_config") {
    const { areaTreeRef, linkInterfaceMapRef, config } = action;
    // Reset state
    areaTreeRef.current = new AreaTree();
    linkInterfaceMapRef.current.clear();
    // Get state from config
    getStateFromConfig(
      areaTreeRef.current,
      linkInterfaceMapRef.current,
      config
    );
    // redraw network
    redrawNetwork(areaTreeRef.current, linkInterfaceMapRef.current);
    return {
      ...state,
      warnConfigLoad: false,
    };
  }
  return state;
};
