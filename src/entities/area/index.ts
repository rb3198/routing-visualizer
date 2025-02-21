import { Point2D } from "../../types/geometry";
import { IPv4Address } from "../ip/ipv4_address";
import { getAllRectPoints } from "../../utils/geometry";
import { Rect2D } from "../geometry/Rect2D";
import { GridCell } from "../geometry/grid_cell";
import { OSPFConfig } from "../ospf/config";
import { Router } from "../router";
import { store } from "../../store";
import { RouterPowerState } from "../router/enum/RouterPowerState";

export class OSPFArea {
  /**
   * Bounding box representing the area contained in the OSPF Area. Runs on inverted Y axis as per JS norms.
   *
   * p1 = top left point, p2 = top right point, p3 = bottom right point, p4 = bottom left point.
   */
  boundingBox: Rect2D;
  /**
   * A set of all locations of routers stored in the OSPF Area, stored as `<x coordinate>_<y_coordinate>`
   */
  routerLocations: Map<string, Router>;

  /**
   * ID to identify the OSPF Area.
   */
  id: number;

  /**
   * Name of the OSPF Area.
   */
  name: string;

  /**
   * IP of this OSPF Area.
   */
  ip: IPv4Address;

  /**
   * Cell containing the label of the OSPF Area. Should be non-interactive.
   */
  labelCell: Point2D;

  routerSubnetMask: number = 24;

  /**
   * OSPF Area in the simulator also behaves as a single OSPF Area. Therefore, OSPF Configuration is attached to the OSPF Area itself.
   */
  ospfConfig: OSPFConfig;

  /**
   *
   * @param low Top left point of the OSPF Area's bounding box
   * @param high Bottom right point of the OSPF Area's bounding box
   * @param id ID to assign to this OSPF Area. Will be labelled on the canvas.
   * @param routerLocations Point2D Locations of routers, if any, in the OSPF Area.
   */
  constructor(low: Point2D, high: Point2D, id: number, ip: IPv4Address) {
    // 2 bytes for identifying the OSPF Area, 3rd byte for the router,
    // and the 4th byte to identify devices connected to the router.
    const [byte1, byte2] = ip.bytes;
    const areaSubnetMask = 16;
    this.labelCell = low;
    this.boundingBox = new Rect2D(low, high);
    this.id = id;
    this.name = `Area ${id}`;
    this.ip = new IPv4Address(byte1, byte2, 0, 0, areaSubnetMask);
    const { simulationConfig } = store.getState();
    const { rxmtInterval } = simulationConfig;
    this.ospfConfig = new OSPFConfig(id, undefined, rxmtInterval);
    this.routerLocations = new Map();
  }

  getRouterLocationKey = (row: number, col: number) => `${row}_${col}`;

  placeRouter = (
    row: number,
    col: number,
    nGlobalRouters: number,
    simulationPlaying?: boolean
  ) => {
    const key = this.getRouterLocationKey(row, col);
    const { simulationConfig } = store.getState();
    const { gracefulShutdown } = simulationConfig;
    const router = new Router(
      key,
      [col, row],
      new IPv4Address(
        nGlobalRouters + 1,
        nGlobalRouters + 1,
        nGlobalRouters + 1,
        nGlobalRouters + 1,
        32
      ),
      this.ospfConfig,
      simulationPlaying ? RouterPowerState.On : RouterPowerState.Shutdown, // new router is turned on if the simulation is playing
      gracefulShutdown
    );
    this.routerLocations.set(key, router);
    return router;
  };

  /**
   * Draws the OSPF Area from scratch on the grid.
   * Redraws all the routers and paths included in the OSPF Area.
   * @param context
   * @param strokeStyle
   * @param fillStyle
   */
  draw = (
    context: CanvasRenderingContext2D,
    strokeStyle: string,
    fillStyle: string,
    gridRect: GridCell[][]
  ) => {
    const { cellSize } = store.getState();
    const { low, high } = this.boundingBox;
    context.clearRect(
      low[0] * cellSize,
      low[1] * cellSize,
      (high[0] - low[0]) * cellSize,
      (high[1] - low[1]) * cellSize
    );
    const { p1, p2, p3, p4 } = getAllRectPoints(low, high);
    for (let i = p1[0]; i < p3[0]; i++) {
      for (let j = p1[1]; j < p3[1]; j++) {
        gridRect[j][i].drawEmpty(context);
      }
    }
    context.beginPath();
    context.strokeStyle = strokeStyle;
    context.fillStyle = fillStyle;
    context.setLineDash([3, 3]);
    context.moveTo(p1[0] * cellSize, p1[1] * cellSize);
    context.lineTo(p2[0] * cellSize, p2[1] * cellSize);
    context.lineTo(p3[0] * cellSize, p3[1] * cellSize);
    context.lineTo(p4[0] * cellSize, p4[1] * cellSize);
    context.lineTo(p1[0] * cellSize, p1[1] * cellSize);
    context.stroke();
    context.fill();
    context.closePath();
    context.setLineDash([]);
    context.font = `${cellSize / 3}px sans-serif`;
    const { actualBoundingBoxAscent, actualBoundingBoxDescent } =
      context.measureText(this.name);
    const textHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
    context.fillStyle = strokeStyle;
    context.fillText(
      this.name,
      low[0] * cellSize + textHeight / 4,
      low[1] * cellSize + (5 * textHeight) / 4,
      cellSize - 5
    );
    for (let [loc, router] of this.routerLocations.entries()) {
      const [row, col] = loc.split("_").map((l) => parseInt(l));
      gridRect[row][col] &&
        gridRect[row][col].drawRouter(context, router.id.ip);
    }
  };

  setRxmtInterval = (rxmtInterval: number) => {
    this.routerLocations.forEach((router) => {
      router.ospf.config.rxmtInterval = rxmtInterval;
    });
  };
}
