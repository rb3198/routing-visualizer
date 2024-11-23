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
  iconLayer: HTMLCanvasElement
) => {
  const [col, row] = cell;
  const areaLayerContext = areaLayer.getContext("2d");
  const iconLayerContext = iconLayer.getContext("2d");
  if (!areaLayerContext) {
    return;
  }
  const arBounds = getAreaPosition(
    row,
    col,
    areaSize,
    gridRect[0]?.length ?? 0,
    gridRect.length
  );
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
    area.draw(areaLayerContext, Colors.accent, areaFillColor, gridRect);
    areaTree.insert(areaCentroid, area);
    iconLayerContext && gridRect[row][col].drawEmpty(iconLayerContext);
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
  const [, nearestArea] = areaTree.searchClosest([col, row]);
  const { routerLocations, getRouterLocationKey, placeRouter } = nearestArea;
  const routerKey = getRouterLocationKey(row, col);
  if (routerLocations.has(routerKey)) {
    return;
  }
  const context = componentLayer.getContext("2d");
  if (!context) {
    return;
  }
  let nGlobalRouters = 0;
  areaTree
    .inOrderTraversal(areaTree.root)
    .forEach(([, area]) =>
      area.routerLocations.forEach(() => nGlobalRouters++)
    );
  const rect = gridRect[row][col];
  const router = placeRouter(row, col, nGlobalRouters, simulationPlaying);
  rect.drawRouter(context, router.id.ip);
};

const getConnectionOptions = (selectedRouter: Router, areaTree: AreaTree) => {
  const { ipInterfaces, key: selectedRouterKey } = selectedRouter;
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
        return area.id !== BACKBONE_AREA_ID && area.routerLocations.size > 0;
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
      iconLayer &&
      placeArea(cell, areaSize, gridRect, areaTree, areaLayer, iconLayer);
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
      selectedRouter: undefined,
      cell: cell ?? [-1, -1],
      componentPicker: defaultPickerState,
      routerMenu: defaultRouterMenuState,
    };
  }
  if (type === "router_interaction_completed") {
    const { cell } = action;
    return {
      ...state,
      state: "hovering",
      selectedRouter: undefined,
      cell: cell ?? [-1, -1],
      componentPicker: defaultPickerState,
      routerMenu: defaultRouterMenuState,
      // cursor: TODO
    };
  }
  if (type === "play") {
    const { areaTree } = action;
    let newSelectedRouter = prevSelectedRouter;
    areaTree.inOrderTraversal(areaTree.root).forEach(([, ar]) => {
      const { routerLocations } = ar;
      for (const router of routerLocations.values()) {
        const newRouter = router.turnOn();
        if (router === prevSelectedRouter) {
          newSelectedRouter = newRouter;
        }
      }
    });
    const newState: InteractiveState = {
      ...state,
      simulationStatus: "playing",
    };
    if (newSelectedRouter !== prevSelectedRouter) {
      newState.selectedRouter = newSelectedRouter;
    }
    return newState;
  }
  // TODO: Type = Pause / Stop.
  if (type === "hover") {
    const { cell, iconLayer, draw, cursor } = action;
    if (prevInteractionState !== "hovering") {
      return state;
    }
    if (prevCell) {
      // clear the cell
      managePreviousHover(prevCell, cell, gridRect, iconLayer);
    }
    draw && drawAddIcon(gridRect, cell, iconLayer);
    return {
      ...state,
      cell,
      cursor,
    };
  }
  if (type === "click") {
    const { cell, iconLayer, areaTree } = action;
    const [column, row] = cell;

    switch (prevInteractionState) {
      case "hovering":
        if (state.cursor !== "pointer") {
          return state;
        }
        if (areaTree.root) {
          const [, nearestArea] = areaTree.searchClosest(cell);
          const { routerLocations, boundingBox, getRouterLocationKey } =
            nearestArea;
          if (boundingBox.isWithinBounds(cell)) {
            const routerLoc = getRouterLocationKey(row, column);
            const router = routerLocations.get(routerLoc);
            if (router) {
              // If sending packet dispatch send packet (write in diff case) else open router menu
              const connectionOptions = getConnectionOptions(router, areaTree);
              return {
                ...state,
                state: "router_interaction",
                cell,
                componentPicker: defaultPickerState,
                selectedRouter: router,
                routerMenu: { visible: true, connectionOptions },
                cursor: "pointer",
              };
            } else {
              return {
                ...state,
                state: "picking_component",
                routerMenu: defaultRouterMenuState,
                selectedRouter: router,
                cell,
                componentPicker: {
                  option: "router",
                  visible: true,
                },
              };
            }
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
      case "sending_packet":
        break;
      default:
        return state;
    }
  }
  return state;
};
