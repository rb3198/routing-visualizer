import { Point2D } from "../../types/geometry";
import { IPv4Address } from "../ip/ipv4_address";
import { getAllRectPoints } from "../../utils/geometry";
import { Rect2D } from "../geometry/Rect2D";
import { OSPFConfig } from "../ospf/config";
import { Router } from "../router";
import { store } from "../../store";
import { RouterPowerState } from "../router/enum/RouterPowerState";
import {
  beforeDraw,
  getCellSize,
  getVisibleWorldBounds,
  postDraw,
} from "src/utils/drawing";
import { KDTree } from "ts-data-structures-collection/trees";

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
  routerLocations: KDTree<Router>;

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
    const { helloInterval, rxmtInterval, MaxAge } = simulationConfig;
    this.ospfConfig = new OSPFConfig(id, helloInterval, rxmtInterval, MaxAge);
    this.routerLocations = new KDTree(2);
  }

  addRouterToTree = (router: Router) => {
    const { boundingBox } = router;
    const { centroid } = boundingBox;
    this.routerLocations.insert(centroid, router);
  };

  placeRouter = (
    routerLow: Point2D,
    nGlobalRouters: number,
    simulationPlaying?: boolean
  ) => {
    const { simulationConfig } = store.getState();
    const { gracefulShutdown } = simulationConfig;
    const router = new Router(
      routerLow,
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
    this.addRouterToTree(router);
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
    areaLayerCtx: CanvasRenderingContext2D,
    compLayerCtx: CanvasRenderingContext2D,
    strokeStyle: string,
    fillStyle: string
  ) => {
    const cellSize = getCellSize();
    const { low, high } = this.boundingBox;
    const { areaLayer } = window;
    if (!areaLayer) {
      return;
    }
    const { width, height } = areaLayer.getBoundingClientRect();
    const { startX, startY, endX, endY } = getVisibleWorldBounds(width, height);
    const visibleRect = new Rect2D([startX, startY], [endX, endY]);
    const { p1, p2, p3, p4 } = getAllRectPoints(low, high);
    if ([p1, p2, p3, p4].every((p) => !visibleRect.isWithinBounds(p))) {
      return;
    }
    beforeDraw(areaLayerCtx);
    areaLayerCtx.clearRect(low[0], low[1], high[0] - low[0], high[1] - low[1]);
    areaLayerCtx.beginPath();
    areaLayerCtx.strokeStyle = strokeStyle;
    areaLayerCtx.fillStyle = fillStyle;
    areaLayerCtx.setLineDash([3, 3]);
    areaLayerCtx.moveTo(p1[0], p1[1]);
    areaLayerCtx.lineTo(p2[0], p2[1]);
    areaLayerCtx.lineTo(p3[0], p3[1]);
    areaLayerCtx.lineTo(p4[0], p4[1]);
    areaLayerCtx.lineTo(p1[0], p1[1]);
    areaLayerCtx.stroke();
    areaLayerCtx.fill();
    areaLayerCtx.closePath();
    areaLayerCtx.setLineDash([]);
    areaLayerCtx.font = `${cellSize / 3}px sans-serif`;
    const { actualBoundingBoxAscent, actualBoundingBoxDescent } =
      areaLayerCtx.measureText(this.name);
    const textHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
    areaLayerCtx.fillStyle = strokeStyle;
    areaLayerCtx.fillText(
      this.name,
      low[0] + textHeight / 4,
      low[1] + (5 * textHeight) / 4,
      cellSize - 5
    );
    for (let [, router] of this.routerLocations.inOrderTraversal(
      this.routerLocations.root
    )) {
      router.draw(compLayerCtx);
    }
    postDraw(areaLayerCtx);
  };

  setRxmtInterval = (rxmtInterval: number) => {
    this.routerLocations
      .inOrderTraversal(this.routerLocations.root)
      .forEach(([, router]) => {
        router.ospf.config.rxmtInterval = rxmtInterval;
      });
  };
}
