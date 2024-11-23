import { AreaTree } from "src/entities/area_tree";
import { GridCell } from "src/entities/geometry/grid_cell";
import { Router } from "src/entities/router";
import { Point2D } from "src/types/geometry";

export type PickerState = {
  visible: boolean;
};

export type ComponentPickerState = PickerState & {
  option: "area" | "router" | "none";
};

export type RouterMenuState = PickerState & {
  connectionOptions: {
    name: string;
    connectionOptions: [string, Router][];
  }[];
};

export type DefaultComponentPickerState = {
  visible: false;
  option: "none";
};

export type DefaultRouterMenuState = {
  visible: false;
};

export type InteractiveState = {
  gridRect: GridCell[][];
  cursor: "initial" | "pointer";
  cell: Point2D;
} & (
  | {
      simulationStatus: "playing" | "paused" | "stopped";
      state: "hovering";
      selectedRouter: undefined;
      componentPicker: DefaultComponentPickerState;
      routerMenu: DefaultRouterMenuState;
    }
  | {
      simulationStatus: "playing" | "paused" | "stopped";
      state: "picking_component";
      selectedRouter: undefined;
      componentPicker: ComponentPickerState;
      routerMenu: DefaultRouterMenuState;
    }
  | {
      simulationStatus: "playing" | "paused" | "stopped";
      state: "router_interaction";
      selectedRouter: Router;
      componentPicker: DefaultComponentPickerState;
      routerMenu: RouterMenuState;
    }
  | {
      simulationStatus: "playing";
      state: "sending_packet";
      selectedRouter: Router;
      componentPicker: DefaultComponentPickerState;
      routerMenu: DefaultRouterMenuState;
    }
);

export type InteractiveAction =
  | {
      type: "set_grid";
      gridRect: GridCell[][];
    }
  | {
      type: "pause" | "stop";
    }
  | {
      type: "play";
      areaTree: AreaTree;
    }
  | {
      type: "component_picked";
      cell: Point2D;
      areaSize: number;
      areaTree: AreaTree;
      areaLayer?: HTMLCanvasElement | null;
      iconLayer?: HTMLCanvasElement | null;
      compLayer?: HTMLCanvasElement | null;
    }
  | {
      type: "router_interaction_completed";
      cell?: Point2D;
    }
  | {
      type: "hover";
      cell: Point2D;
      iconLayer: HTMLCanvasElement;
      cursor: "initial" | "pointer";
      draw?: boolean;
    }
  | {
      type: "click";
      cell: Point2D;
      componentPickerComponent?: HTMLDivElement | null;
      routerMenuComponent?: HTMLDivElement | null;
      areaLayer: HTMLCanvasElement;
      iconLayer: HTMLCanvasElement;
      areaTree: AreaTree;
    };
